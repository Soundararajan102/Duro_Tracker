import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_tenant_admin, get_tenant_db
from app.models import Provider, PurchaseEntry, Item
from app.schemas.provider import ProviderCreate, ProviderOut, ProviderUpdate
from app.schemas.purchase import PurchaseEntryCreate, PurchaseEntryOut

router = APIRouter(dependencies=[Depends(require_tenant_admin())], tags=["Purchases"])

@router.post("/providers", response_model=ProviderOut)
async def create_provider(
    provider_in: ProviderCreate,
    db: AsyncSession = Depends(get_tenant_db),
):
    provider = Provider(
        name=provider_in.name,
        phone=provider_in.phone,
        is_active=provider_in.is_active,
    )
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return provider

@router.get("/providers", response_model=list[ProviderOut])
async def list_providers(
    db: AsyncSession = Depends(get_tenant_db),
):
    result = await db.scalars(select(Provider))
    return result.all()

@router.post("/", response_model=PurchaseEntryOut)
async def create_purchase(
    purchase_in: PurchaseEntryCreate,
    db: AsyncSession = Depends(get_tenant_db),
):
    provider = await db.get(Provider, purchase_in.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    item = await db.get(Item, purchase_in.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    entry = PurchaseEntry(
        provider_id=provider.id,
        item_id=item.id,
        full_received=purchase_in.full_received,
        empty_returned=purchase_in.empty_returned,
        total_cost=purchase_in.total_cost,
        amount_paid=purchase_in.amount_paid,
    )
    db.add(entry)
    
    # Update Item counts
    item.current_full += purchase_in.full_received
    item.current_empty -= purchase_in.empty_returned
    
    # Update Provider ledger
    provider.balance_pending += (purchase_in.total_cost - purchase_in.amount_paid)
    provider.cylinders_pending += (purchase_in.full_received - purchase_in.empty_returned)

    await db.commit()
    await db.refresh(entry)
    return entry

@router.get("/", response_model=list[PurchaseEntryOut])
async def list_purchases(
    db: AsyncSession = Depends(get_tenant_db),
):
    result = await db.scalars(select(PurchaseEntry))
    return result.all()
