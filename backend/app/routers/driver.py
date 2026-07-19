import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user, require_roles, get_tenant_db
from app.models import Buyer, DeliveryBill, DeliveryItem, Item, User
from app.models.enums import UserRole
from app.schemas.delivery import DeliveryBillCreate, DeliveryBillOut
from app.schemas.item import ItemOut
from app.schemas.buyer import BuyerOut
from fastapi import Header
import datetime

router = APIRouter(dependencies=[Depends(require_roles(UserRole.DRIVER, UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN))])


@router.post("/entries", response_model=DeliveryBillOut)
async def create_delivery_entry(
    bill_in: DeliveryBillCreate,
    x_idempotency_key: Annotated[str | None, Header()] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_tenant_db),
):
    if x_idempotency_key:
        existing_bill = await db.scalar(
            select(DeliveryBill).where(DeliveryBill.idempotency_key == x_idempotency_key)
        )
        if existing_bill:
            # Need to eager load items for the response
            final_existing = await db.scalar(
                select(DeliveryBill)
                .options(joinedload(DeliveryBill.buyer), selectinload(DeliveryBill.items).joinedload(DeliveryItem.item))
                .where(DeliveryBill.id == existing_bill.id)
            )
            return final_existing
            
    async with db.begin_nested() if db.in_transaction() else db.begin():
        buyer = None
        if bill_in.buyer_id:
            buyer = await db.get(Buyer, bill_in.buyer_id)
            if not buyer:
                raise HTTPException(status_code=404, detail="Buyer not found")

        # Create the Bill parent
        bill = DeliveryBill(
            driver_id=current_user.id,
            buyer_id=bill_in.buyer_id,
            adhoc_buyer_name=bill_in.adhoc_buyer_name,
            total_bill_amount=0.0,
            cash_collected=bill_in.cash_collected,
            upi_collected=bill_in.upi_collected,
            timestamp=datetime.datetime.now(datetime.UTC),
            idempotency_key=x_idempotency_key,
        )
        db.add(bill)
        
        total_bill = 0.0
        total_full_delivered = 0
        total_empty_received = 0
        
        for item_in in bill_in.items:
            item = await db.get(Item, item_in.item_id)
            if not item:
                raise HTTPException(status_code=404, detail=f"Item {item_in.item_id} not found")
                
            # Snapshot pricing
            unit_price = float(item.price)
            if buyer and buyer.price_per_kg is not None and item.capacity_kg is not None:
                unit_price = float(buyer.price_per_kg) * float(item.capacity_kg)
                
            line_total = unit_price * item_in.full_delivered
            total_bill += line_total
            
            # Create Entry item
            entry = DeliveryItem(
                bill=bill,
                item_id=item.id,
                unit_price_at_delivery=unit_price,
                line_total_amount=line_total,
                full_delivered=item_in.full_delivered,
                empty_received=item_in.empty_received,
            )
            db.add(entry)
            
            # Update Item Inventory (Running Totals)
            item.current_full -= item_in.full_delivered
            item.current_empty += item_in.empty_received
            
            total_full_delivered += item_in.full_delivered
            total_empty_received += item_in.empty_received
        
        bill.total_bill_amount = total_bill
        
        # Update Buyer Balances
        if buyer:
            buyer.cylinders_pending = int(buyer.cylinders_pending) + total_full_delivered
            buyer.cylinders_pending = int(buyer.cylinders_pending) - total_empty_received
            
            buyer.balance_pending = float(buyer.balance_pending) + total_bill
            buyer.balance_pending = float(buyer.balance_pending) - (bill_in.cash_collected + bill_in.upi_collected)
            
    await db.flush()
    # Capture ID before commit
    bill_id = bill.id
    await db.commit()
    
    # Eagerly load the buyer and items for response
    final_bill = await db.scalar(
        select(DeliveryBill)
        .options(joinedload(DeliveryBill.buyer), selectinload(DeliveryBill.items).joinedload(DeliveryItem.item))
        .where(DeliveryBill.id == bill_id)
    )
    return final_bill


@router.get("/entries", response_model=list[DeliveryBillOut])
async def list_delivery_entries(
    db: AsyncSession = Depends(get_tenant_db),
):
    result = await db.scalars(
        select(DeliveryBill)
        .options(joinedload(DeliveryBill.buyer), selectinload(DeliveryBill.items).joinedload(DeliveryItem.item))
        .order_by(DeliveryBill.timestamp.desc())
    )
    return result.unique().all()


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
