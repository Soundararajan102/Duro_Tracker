# pyright: reportUnboundVariable=false
# pyright: reportPossiblyUnboundVariable=false
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user, require_roles, get_tenant_db
from app.models import Buyer, DeliveryBill, DeliveryItem, Item, User
from app.models.enums import UserRole
from app.schemas.delivery import DeliveryBillCreate, DeliveryBillOut, DebtCollectionCreate
from app.schemas.item import ItemOut
from app.schemas.buyer import BuyerOut
from fastapi import Header
import datetime
from app.models.sequence import TenantSequence

async def generate_bill_number(db: AsyncSession, target_date: datetime.datetime, prefix: str = "SHA") -> str:
    # Format: prefix_YYYY_MM
    year = target_date.strftime("%Y")
    month = target_date.strftime("%m")
    seq_name = f"bill_{prefix.lower()}_{year}_{month}"
    
    seq = await db.scalar(select(TenantSequence).where(TenantSequence.name == seq_name).with_for_update())
    if not seq:
        seq = TenantSequence(name=seq_name, last_value=0)
        db.add(seq)
        
    seq.last_value += 1
    # 5-digit padding: SHA-YYYY-MM-XXXXX
    return f"{prefix}-{year}-{month}-{seq.last_value:05d}"

router = APIRouter(tags=["Driver"])

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
                .options(joinedload(DeliveryBill.buyer).selectinload(Buyer.inventory), selectinload(DeliveryBill.items).joinedload(DeliveryItem.item))
                .where(DeliveryBill.id == existing_bill.id)
            )
            return final_existing
            
    async with db.begin_nested() if db.in_transaction() else db.begin():
        from sqlalchemy import text
        await db.execute(text("SET LOCAL lock_timeout = '3s';"))
        
        buyer = None
        if bill_in.buyer_id:
            buyer = await db.scalar(
                select(Buyer)
                .options(selectinload(Buyer.inventory))
                .where(Buyer.id == bill_in.buyer_id)
                .with_for_update()
            )
            if not buyer:
                raise HTTPException(status_code=404, detail="Buyer not found")

        # Determine timestamp and generate bill number
        bill_timestamp = bill_in.timestamp if bill_in.timestamp else datetime.datetime.now(datetime.UTC)
        # Ensure timestamp has timezone info
        if bill_timestamp.tzinfo is None:
            bill_timestamp = bill_timestamp.replace(tzinfo=datetime.UTC)
            
        new_bill_number = await generate_bill_number(db, bill_timestamp)

        # Create the Bill parent
        bill = DeliveryBill(
            driver_id=current_user.id,
            buyer_id=bill_in.buyer_id,
            adhoc_buyer_name=bill_in.adhoc_buyer_name,
            bill_number=new_bill_number,
            total_bill_amount=0.0,
            cash_collected=bill_in.cash_collected,
            upi_collected=bill_in.upi_collected,
            timestamp=bill_timestamp,
            idempotency_key=x_idempotency_key,
        )
        db.add(bill)
        
        total_bill = 0.0
        total_full_delivered = 0
        total_empty_received = 0
        
        # Sort items by item_id to prevent deadlocks when locking multiple items
        sorted_items = sorted(bill_in.items, key=lambda x: str(x.item_id))
        
        for item_in in sorted_items:
            item = await db.scalar(select(Item).where(Item.id == item_in.item_id).with_for_update())
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
                buyer_holding_snapshot=0,
            )
            db.add(entry)
            
            # Update Item Inventory (Running Totals)
            item.current_full -= item_in.full_delivered
            item.current_empty += item_in.empty_received
            if item.current_full < 0:
                raise HTTPException(status_code=400, detail=f"Not enough full cylinders in warehouse for item {item.name}")
            
            # Update Buyer Inventory
            if buyer:
                from app.models.buyer import BuyerInventory
                buyer_inv = next((inv for inv in buyer.inventory if inv.item_id == item.id), None)
                if not buyer_inv:
                    buyer_inv = BuyerInventory(item_id=item.id, cylinders_pending=0)
                    buyer.inventory.append(buyer_inv)
                buyer_inv.cylinders_pending += item_in.full_delivered
                buyer_inv.cylinders_pending -= item_in.empty_received
                if buyer_inv.cylinders_pending < 0:
                    raise HTTPException(status_code=400, detail=f"Buyer cannot return more empty cylinders than they currently hold for item {item.name}")
                
                entry.buyer_holding_snapshot = buyer_inv.cylinders_pending
            
            total_full_delivered += item_in.full_delivered
            total_empty_received += item_in.empty_received
        
        bill.total_bill_amount = total_bill
        
        # Update Buyer Balances
        if buyer:
            buyer.balance_pending = float(buyer.balance_pending) + total_bill
            buyer.balance_pending = float(buyer.balance_pending) - (bill_in.cash_collected + bill_in.upi_collected)
            
    await db.flush()
    # Capture ID before commit
    bill_id = bill.id
    await db.commit()
    
    # Eagerly load the buyer and items for response
    final_bill = await db.scalar(
        select(DeliveryBill)
        .options(joinedload(DeliveryBill.buyer).selectinload(Buyer.inventory), selectinload(DeliveryBill.items).joinedload(DeliveryItem.item))
        .where(DeliveryBill.id == bill_id)
    )
    return final_bill


@router.get("/entries")
async def list_delivery_entries(
    paginated: bool = False,
    cursor: uuid.UUID | None = None,
    limit: int = 20,
    bill_type: str | None = None,
    db: AsyncSession = Depends(get_tenant_db),
):
    query = select(DeliveryBill).options(
        joinedload(DeliveryBill.buyer).selectinload(Buyer.inventory),
        selectinload(DeliveryBill.items).joinedload(DeliveryItem.item)
    )
    
    if bill_type == "sales":
        query = query.filter(DeliveryBill.items.any())
    elif bill_type == "collections":
        query = query.filter(~DeliveryBill.items.any())

    if paginated:
        if cursor:
            query = query.filter(DeliveryBill.id < cursor)
        query = query.order_by(DeliveryBill.id.desc()).limit(limit)
        result = await db.scalars(query)
        items = result.unique().all()
        next_cursor = items[-1].id if len(items) == limit else None
        return {"items": items, "next_cursor": next_cursor}
    else:
        query = query.order_by(DeliveryBill.id.desc()).limit(100)
        result = await db.scalars(query)
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
    result = await db.scalars(
        select(Buyer)
        .options(selectinload(Buyer.inventory))
        .where(Buyer.is_active == True)
    )
    return result.unique().all()


@router.post("/collections", response_model=DeliveryBillOut)
async def create_debt_collection(
    collection_in: DebtCollectionCreate,
    x_idempotency_key: Annotated[str | None, Header()] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_tenant_db),
):
    if collection_in.cash_collected + collection_in.upi_collected <= 0:
        raise HTTPException(status_code=400, detail="Collection amount must be greater than zero.")

    if x_idempotency_key:
        existing_bill = await db.scalar(
            select(DeliveryBill).where(DeliveryBill.idempotency_key == x_idempotency_key)
        )
        if existing_bill:
            final_existing = await db.scalar(
                select(DeliveryBill)
                .options(joinedload(DeliveryBill.buyer).selectinload(Buyer.inventory), selectinload(DeliveryBill.items).joinedload(DeliveryItem.item))
                .where(DeliveryBill.id == existing_bill.id)
            )
            return final_existing

    async with db.begin_nested() if db.in_transaction() else db.begin():
        from sqlalchemy import text
        await db.execute(text("SET LOCAL lock_timeout = '3s';"))

        buyer = await db.scalar(
            select(Buyer)
            .options(selectinload(Buyer.inventory))
            .where(Buyer.id == collection_in.buyer_id)
            .with_for_update()
        )
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")

        # Determine timestamp and generate bill number
        bill_timestamp = collection_in.timestamp if collection_in.timestamp else datetime.datetime.now(datetime.UTC)
        if bill_timestamp.tzinfo is None:
            bill_timestamp = bill_timestamp.replace(tzinfo=datetime.UTC)

        new_bill_number = await generate_bill_number(db, bill_timestamp, prefix="PAY")

        # Create the Bill parent
        bill = DeliveryBill(
            driver_id=current_user.id,
            buyer_id=collection_in.buyer_id,
            adhoc_buyer_name=None,
            bill_number=new_bill_number,
            total_bill_amount=0.0,
            cash_collected=collection_in.cash_collected,
            upi_collected=collection_in.upi_collected,
            timestamp=bill_timestamp,
            idempotency_key=x_idempotency_key,
        )
        db.add(bill)

        # Update Buyer Balances
        buyer.balance_pending = float(buyer.balance_pending) - (collection_in.cash_collected + collection_in.upi_collected)

    await db.flush()
    bill_id = bill.id
    await db.commit()

    final_bill = await db.scalar(
        select(DeliveryBill)
        .options(joinedload(DeliveryBill.buyer).selectinload(Buyer.inventory), selectinload(DeliveryBill.items).joinedload(DeliveryItem.item))
        .where(DeliveryBill.id == bill_id)
    )
    return final_bill
