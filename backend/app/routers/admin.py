import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_tenant_admin, get_tenant_db, get_platform_db
from app.core.security import get_password_hash
from app.models import Buyer, Item, User
from app.models.enums import UserRole
from app.schemas.buyer import BuyerCreate, BuyerOut, BuyerUpdate
from app.schemas.item import ItemCreate, ItemOut, ItemUpdate
from app.schemas.user import UserCreate, UserOut

router = APIRouter(dependencies=[Depends(require_tenant_admin())])


@router.post("/items", response_model=ItemOut)
async def create_item(
    item_in: ItemCreate,
    db: AsyncSession = Depends(get_tenant_db),
):
    item = Item(
        name=item_in.name,
        category=item_in.category,
        price=item_in.price,
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
    if item_in.is_active is not None:
        item.is_active = item_in.is_active

    await db.commit()
    await db.refresh(item)
    return item


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


# --- DRIVERS ---
@router.post("/drivers", response_model=UserOut)
async def create_driver(
    user_in: UserCreate,
    current_user: User = Depends(require_tenant_admin()),
    db: AsyncSession = Depends(get_platform_db),
):
    org_id = current_user.organization_id
    
    existing = await db.scalar(
        select(User).where(User.username == user_in.username, User.organization_id == org_id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists in this organization")

    driver = User(
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        role=UserRole.DRIVER,
        organization_id=org_id,
        is_active=user_in.is_active,
    )
    db.add(driver)
    await db.commit()
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
