import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_tenant_admin, get_tenant_db
from app.models import Provider, PurchaseEntry, PurchaseBill, Item
from app.schemas.provider import ProviderCreate, ProviderOut, ProviderUpdate
from app.schemas.purchase import PurchaseBillCreate, PurchaseBillOut
from sqlalchemy.orm import selectinload, joinedload
from fastapi import Header

router = APIRouter(dependencies=[Depends(require_tenant_admin())], tags=["Purchases"])

@router.post("/providers", response_model=ProviderOut)
async def create_provider(
    provider_in: ProviderCreate,
    db: AsyncSession = Depends(get_tenant_db),
):
    provider = Provider(
        name=provider_in.name,
        phone=provider_in.phone,
        gstin=provider_in.gstin,
        price_per_kg=provider_in.price_per_kg,
        is_active=provider_in.is_active,
    )
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return provider

@router.put("/providers/{provider_id}", response_model=ProviderOut)
async def update_provider(
    provider_id: uuid.UUID,
    provider_in: ProviderUpdate,
    db: AsyncSession = Depends(get_tenant_db),
):
    provider = await db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if provider_in.name is not None:
        provider.name = provider_in.name
    if provider_in.phone is not None:
        provider.phone = provider_in.phone
    if provider_in.gstin is not None:
        provider.gstin = provider_in.gstin
    if provider_in.price_per_kg is not None:
        provider.price_per_kg = provider_in.price_per_kg
    if provider_in.is_active is not None:
        provider.is_active = provider_in.is_active

    await db.commit()
    await db.refresh(provider)
    return provider

@router.get("/providers", response_model=list[ProviderOut])
async def list_providers(
    db: AsyncSession = Depends(get_tenant_db),
):
    result = await db.scalars(select(Provider))
    return result.all()

@router.post("/", response_model=PurchaseBillOut)
async def create_purchase_bill(
    bill_in: PurchaseBillCreate,
    x_idempotency_key: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_tenant_db),
):
    if x_idempotency_key:
        existing_bill = await db.scalar(
            select(PurchaseBill).where(PurchaseBill.idempotency_key == x_idempotency_key)
        )
        if existing_bill:
            final_existing = await db.scalar(
                select(PurchaseBill)
                .options(joinedload(PurchaseBill.provider), selectinload(PurchaseBill.entries).joinedload(PurchaseEntry.item))
                .where(PurchaseBill.id == existing_bill.id)
            )
            return final_existing

    provider = await db.get(Provider, bill_in.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    bill = PurchaseBill(
        provider_id=provider.id,
        bill_number=bill_in.bill_number,
        total_cost=bill_in.total_cost,
        amount_paid=bill_in.amount_paid,
        idempotency_key=x_idempotency_key,
    )
    db.add(bill)
    
    total_full_received = 0
    total_empty_returned = 0
    
    for item_in in bill_in.items:
        item = await db.get(Item, item_in.item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {item_in.item_id} not found")
            
        entry = PurchaseEntry(
            bill=bill,
            item_id=item.id,
            full_received=item_in.full_received,
            empty_returned=item_in.empty_returned,
            total_cost=item_in.total_cost,
        )
        db.add(entry)
        
        # Update Item counts
        item.current_full += item_in.full_received
        item.current_empty -= item_in.empty_returned
        
        total_full_received += item_in.full_received
        total_empty_returned += item_in.empty_returned
        
    # Update Provider ledger ONCE for the entire bill
    provider.balance_pending = float(provider.balance_pending) + (bill_in.total_cost - bill_in.amount_paid)
    provider.cylinders_pending = int(provider.cylinders_pending) + (total_full_received - total_empty_returned)

    await db.commit()
    
    # Refresh bill and load entries
    result = await db.scalars(select(PurchaseBill).options(selectinload(PurchaseBill.entries)).where(PurchaseBill.id == bill.id))
    return result.one()

@router.get("/", response_model=list[PurchaseBillOut])
async def list_purchase_bills(
    db: AsyncSession = Depends(get_tenant_db),
):
    result = await db.scalars(select(PurchaseBill).options(selectinload(PurchaseBill.entries)).order_by(PurchaseBill.created_at.desc()))
    return result.all()
