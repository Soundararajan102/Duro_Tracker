import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.auth.dependencies import require_tenant_admin, get_tenant_db, get_platform_db
from app.core.security import get_password_hash
from app.models import Buyer, Item, User, Organization
from app.models.enums import UserRole
from app.schemas.buyer import BuyerCreate, BuyerOut, BuyerUpdate
from app.schemas.item import ItemCreate, ItemOut, ItemUpdate
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.schemas.organization import OrganizationOut
from pydantic import BaseModel
import datetime

class GlobalBillOut(BaseModel):
    id: uuid.UUID
    time: str
    buyer: str
    fullGiven: int
    emptyCollected: int
    total: float

class LedgerEntryOut(BaseModel):
    id: uuid.UUID
    date: str
    type: str
    fullGiven: int
    emptyCollected: int
    amount: float
    paid: float
    finRunBal: float
    cylRunBal: int

router = APIRouter(dependencies=[Depends(require_tenant_admin())])

@router.get("/organization", response_model=OrganizationOut)
async def get_my_organization(
    current_user: User = Depends(require_tenant_admin()),
    db: AsyncSession = Depends(get_platform_db),
):
    org = await db.get(Organization, current_user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.post("/items", response_model=ItemOut)
async def create_item(
    item_in: ItemCreate,
    db: AsyncSession = Depends(get_tenant_db),
):
    item = Item(
        name=item_in.name,
        category=item_in.category,
        price=item_in.price,
        capacity_kg=item_in.capacity_kg,
        initial_full=item_in.initial_full,
        initial_empty=item_in.initial_empty,
        current_full=item_in.initial_full,
        current_empty=item_in.initial_empty,
        is_active=item_in.is_active,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/items", response_model=list[ItemOut])
async def list_items(
    db: AsyncSession = Depends(get_tenant_db),
):
    result = await db.scalars(select(Item))
    return result.all()


@router.put("/items/{item_id}", response_model=ItemOut)
async def update_item(
    item_id: uuid.UUID,
    item_in: ItemUpdate,
    db: AsyncSession = Depends(get_tenant_db),
):
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item_in.name is not None:
        item.name = item_in.name
    if item_in.category is not None:
        item.category = item_in.category
    if item_in.price is not None:
        item.price = item_in.price
    if item_in.capacity_kg is not None:
        item.capacity_kg = item_in.capacity_kg
    if item_in.current_full is not None:
        item.current_full = item_in.current_full
    if item_in.current_empty is not None:
        item.current_empty = item_in.current_empty
    if item_in.is_active is not None:
        item.is_active = item_in.is_active

    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_tenant_db),
):
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete item because it has associated ledger history. Please deactivate it instead."
        )


# --- BUYERS ---
@router.post("/buyers", response_model=BuyerOut)
async def create_buyer(
    buyer_in: BuyerCreate,
    db: AsyncSession = Depends(get_tenant_db),
):
    buyer = Buyer(
        name=buyer_in.name,
        phone=buyer_in.phone,
        type=buyer_in.type,
        address=buyer_in.address,
        price_per_kg=buyer_in.price_per_kg,
        balance_pending=buyer_in.balance_pending,
        cylinders_pending=buyer_in.cylinders_pending,
    )
    db.add(buyer)
    await db.commit()
    await db.refresh(buyer)
    return buyer


@router.get("/buyers", response_model=list[BuyerOut])
async def list_buyers(
    db: AsyncSession = Depends(get_tenant_db),
):
    result = await db.scalars(select(Buyer))
    return result.all()


@router.get("/buyers/bills", response_model=list[GlobalBillOut])
async def get_global_bills(
    db: AsyncSession = Depends(get_tenant_db),
):
    from sqlalchemy.orm import joinedload, selectinload
    from app.models import DeliveryBill
    result = await db.scalars(
        select(DeliveryBill)
        .options(joinedload(DeliveryBill.buyer), selectinload(DeliveryBill.items))
        .where(DeliveryBill.total_bill_amount > 0)
        .order_by(DeliveryBill.timestamp.desc())
        .limit(20)
    )
    entries = result.all()
    
    bills = []
    for e in entries:
        buyer_name = e.buyer.name if e.buyer else e.adhoc_buyer_name or "Unknown"
        total_full = sum(i.full_delivered for i in e.items)
        total_empty = sum(i.empty_received for i in e.items)
        bills.append(
            GlobalBillOut(
                id=e.id,
                time=e.timestamp.isoformat(),
                buyer=buyer_name,
                fullGiven=total_full,
                emptyCollected=total_empty,
                total=float(e.total_bill_amount)
            )
        )
    return bills


@router.get("/buyers/{buyer_id}/ledger", response_model=list[LedgerEntryOut])
async def get_buyer_ledger(
    buyer_id: uuid.UUID,
    db: AsyncSession = Depends(get_tenant_db),
):
    from app.models import DeliveryBill
    from sqlalchemy.orm import selectinload
    
    # Get all entries for the buyer in chronological order
    result = await db.scalars(
        select(DeliveryBill)
        .options(selectinload(DeliveryBill.items))
        .where(DeliveryBill.buyer_id == buyer_id)
        .order_by(DeliveryBill.timestamp.asc())
    )
    entries = result.all()
    
    ledger = []
    run_fin = 0.0
    run_cyl = 0
    
    for e in entries:
        paid = float(e.cash_collected + e.upi_collected)
        bill_amt = float(e.total_bill_amount)
        
        # Financial impact: bill increases debt, paid decreases debt
        run_fin += (bill_amt - paid)
        
        total_full = sum(i.full_delivered for i in e.items)
        total_empty = sum(i.empty_received for i in e.items)
        
        # Cylinder impact: full_delivered increases debt, empty_received decreases debt
        run_cyl += (total_full - total_empty)
        
        etype = 'bill' if total_full > 0 else 'payment'
        
        ledger.append(
            LedgerEntryOut(
                id=e.id,
                date=e.timestamp.isoformat(),
                type=etype,
                fullGiven=total_full,
                emptyCollected=total_empty,
                amount=bill_amt,
                paid=paid,
                finRunBal=run_fin,
                cylRunBal=run_cyl
            )
        )
        
    # Return reverse chronological order for UI
    return ledger[::-1]

@router.put("/buyers/{buyer_id}", response_model=BuyerOut)
async def update_buyer(
    buyer_id: uuid.UUID,
    buyer_in: BuyerUpdate,
    db: AsyncSession = Depends(get_tenant_db),
):
    buyer = await db.get(Buyer, buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    if buyer_in.name is not None:
        buyer.name = buyer_in.name
    if buyer_in.phone is not None:
        buyer.phone = buyer_in.phone
    if buyer_in.type is not None:
        buyer.type = buyer_in.type
    if buyer_in.address is not None:
        buyer.address = buyer_in.address
    if buyer_in.is_active is not None:
        buyer.is_active = buyer_in.is_active
    if buyer_in.price_per_kg is not None:
        buyer.price_per_kg = buyer_in.price_per_kg
    if buyer_in.balance_pending is not None:
        buyer.balance_pending = buyer_in.balance_pending
    if buyer_in.cylinders_pending is not None:
        buyer.cylinders_pending = buyer_in.cylinders_pending

    await db.commit()
    await db.refresh(buyer)
    return buyer


@router.delete("/buyers/{buyer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_buyer(
    buyer_id: uuid.UUID,
    db: AsyncSession = Depends(get_tenant_db),
):
    buyer = await db.get(Buyer, buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    await db.delete(buyer)
    await db.commit()


# --- DRIVERS ---
@router.post("/drivers", response_model=UserOut)
async def create_driver(
    user_in: UserCreate,
    current_user: User = Depends(require_tenant_admin()),
    db: AsyncSession = Depends(get_platform_db),
):
    org_id = current_user.organization_id
    
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check user limit
    user_count = await db.scalar(select(func.count(User.id)).where(User.organization_id == org_id))
    if user_count and user_count >= org.max_users:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="USER_LIMIT_REACHED")
    driver = User(
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        role=UserRole.DRIVER,
        organization_id=org_id,
        is_active=user_in.is_active,
    )
    db.add(driver)
    
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        if "uq_users_username" in str(e.orig):
            raise HTTPException(status_code=400, detail="Username is already taken globally")
        raise e

    await db.refresh(driver)
    return driver


@router.get("/drivers", response_model=list[UserOut])
async def list_drivers(
    current_user: User = Depends(require_tenant_admin()),
    db: AsyncSession = Depends(get_platform_db),
):
    org_id = current_user.organization_id
    result = await db.scalars(
        select(User).where(User.organization_id == org_id, User.role == UserRole.DRIVER)
    )
    return result.all()


@router.put("/drivers/{driver_id}", response_model=UserOut)
async def update_driver(
    driver_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: User = Depends(require_tenant_admin()),
    db: AsyncSession = Depends(get_platform_db),
):
    org_id = current_user.organization_id
    driver = await db.get(User, driver_id)
    if not driver or driver.organization_id != org_id or driver.role != UserRole.DRIVER:
        raise HTTPException(status_code=404, detail="Driver not found")

    if user_in.is_active is not None:
        driver.is_active = user_in.is_active
    
    if user_in.password is not None:
        driver.password_hash = get_password_hash(user_in.password)

    await db.commit()
    await db.refresh(driver)
    return driver


@router.delete("/drivers/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: uuid.UUID,
    current_user: User = Depends(require_tenant_admin()),
    db: AsyncSession = Depends(get_platform_db),
):
    org_id = current_user.organization_id
    driver = await db.get(User, driver_id)
    if not driver or driver.organization_id != org_id or driver.role != UserRole.DRIVER:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    await db.delete(driver)
    await db.commit()

