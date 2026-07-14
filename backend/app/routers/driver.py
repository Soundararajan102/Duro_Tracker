import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user, require_roles, get_tenant_db
from app.models import Buyer, DeliveryEntry, Item, User
from app.models.enums import UserRole
from app.schemas.delivery import DeliveryEntryCreate, DeliveryEntryOut
from app.schemas.item import ItemOut
from app.schemas.buyer import BuyerOut
from fastapi import Header

router = APIRouter(dependencies=[Depends(require_roles(UserRole.DRIVER, UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN))])


@router.post("/entries", response_model=DeliveryEntryOut)
async def create_delivery_entry(
    entry_in: DeliveryEntryCreate,
    x_idempotency_key: Annotated[str | None, Header()] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_tenant_db),
):
    if x_idempotency_key:
        existing_entry = await db.scalar(
            select(DeliveryEntry).where(DeliveryEntry.idempotency_key == x_idempotency_key)
        )
        if existing_entry:
            return existing_entry
            
    # ACID transaction to ensure inventory, debt, and entry logs are consistent
    async with db.begin_nested() if db.in_transaction() else db.begin():
        # Get Item (for price and inventory)
        item = await db.get(Item, entry_in.item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
            
        buyer = None
        if entry_in.buyer_id:
            buyer = await db.get(Buyer, entry_in.buyer_id)
            if not buyer:
                raise HTTPException(status_code=404, detail="Buyer not found")

        # Snapshot pricing
        unit_price = float(item.price)
        total_bill = unit_price * entry_in.full_delivered

        # Create Entry
        import datetime
        entry = DeliveryEntry(
            driver_id=current_user.id,
            buyer_id=entry_in.buyer_id,
            adhoc_buyer_name=entry_in.adhoc_buyer_name,
            item_id=entry_in.item_id,
            unit_price_at_delivery=unit_price,
            total_bill_amount=total_bill,
            full_delivered=entry_in.full_delivered,
            empty_received=entry_in.empty_received,
            cash_collected=entry_in.cash_collected,
            upi_collected=entry_in.upi_collected,
            timestamp=datetime.datetime.now(datetime.UTC),
            idempotency_key=x_idempotency_key,
        )
        db.add(entry)
        
        # Update Item Inventory (Running Totals)
        item.current_full -= entry_in.full_delivered
        item.current_empty += entry_in.empty_received
        
        # Update Buyer Balances
        if buyer:
            buyer.cylinders_pending += entry_in.full_delivered
            buyer.cylinders_pending -= entry_in.empty_received
            
            buyer.balance_pending += total_bill
            buyer.balance_pending -= (entry_in.cash_collected + entry_in.upi_collected)
            
    await db.refresh(entry)
    return entry


@router.get("/entries", response_model=list[DeliveryEntryOut])
async def list_delivery_entries(
    db: AsyncSession = Depends(get_tenant_db),
):
    result = await db.scalars(
        select(DeliveryEntry).order_by(DeliveryEntry.timestamp.desc())
    )
    return result.all()


@router.get("/items", response_model=list[ItemOut])
async def list_active_items(
    db: AsyncSession = Depends(get_tenant_db),
):
    # Driver can only see active items
    result = await db.scalars(select(Item).where(Item.is_active == True))
    return result.all()


@router.get("/buyers", response_model=list[BuyerOut])
async def list_active_buyers(
    db: AsyncSession = Depends(get_tenant_db),
):
    # Driver can only see active buyers
    result = await db.scalars(select(Buyer).where(Buyer.is_active == True))
    return result.all()
