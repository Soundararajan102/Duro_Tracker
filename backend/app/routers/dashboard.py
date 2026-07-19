import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.auth.dependencies import require_tenant_admin, get_tenant_db
from app.db.session import get_platform_db
from app.models import DeliveryBill, DeliveryItem, Item, User, Buyer

router = APIRouter(dependencies=[Depends(require_tenant_admin())])

class DashboardMetrics(BaseModel):
    total_dispatched: int
    total_empty_received: int
    total_cash_collected: float
    total_upi_collected: float
    outstanding_balance: float
    todays_sales: float

class RecentActivityOut(BaseModel):
    id: uuid.UUID
    type: str # 'delivery' or 'collection'
    message: str
    timestamp: str
    amount: float | None = None

@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    current_user: User = Depends(require_tenant_admin()),
    db: AsyncSession = Depends(get_tenant_db),
):
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="No organization")
        
    org_id = current_user.organization_id
    
    now = datetime.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Aggregate today's collection and sales from DeliveryBill
    bill_result = await db.execute(
        select(
            func.coalesce(func.sum(DeliveryBill.cash_collected), 0),
            func.coalesce(func.sum(DeliveryBill.upi_collected), 0),
            func.coalesce(func.sum(DeliveryBill.total_bill_amount), 0),
        ).where(DeliveryBill.timestamp >= start_of_today)
    )
    bill_row = bill_result.fetchone()
    
    # Aggregate today's item dispatches from DeliveryItem joined with DeliveryBill
    item_result = await db.execute(
        select(
            func.coalesce(func.sum(DeliveryItem.full_delivered), 0),
            func.coalesce(func.sum(DeliveryItem.empty_received), 0),
        ).join(DeliveryBill).where(DeliveryBill.timestamp >= start_of_today)
    )
    item_row = item_result.fetchone()
    
    # Sum of all buyers' pending balances (All time)
    buyers_result = await db.execute(
        select(func.coalesce(func.sum(Buyer.balance_pending), 0))
    )
    outstanding_balance = buyers_result.scalar()

    return DashboardMetrics(
        total_dispatched=item_row[0],
        total_empty_received=item_row[1],
        total_cash_collected=bill_row[0],
        total_upi_collected=bill_row[1],
        outstanding_balance=outstanding_balance,
        todays_sales=bill_row[2],
    )

@router.get("/recent-activity", response_model=list[RecentActivityOut])
async def get_recent_activity(
    current_user: User = Depends(require_tenant_admin()),
    db: AsyncSession = Depends(get_tenant_db),
):
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="No organization")
        
    from sqlalchemy.orm import joinedload, selectinload
    
    # Fetch last 20 deliveries
    result = await db.scalars(
        select(DeliveryBill)
        .options(joinedload(DeliveryBill.driver), joinedload(DeliveryBill.buyer), selectinload(DeliveryBill.items).joinedload(DeliveryItem.item))
        .order_by(DeliveryBill.timestamp.desc())
        .limit(20)
    )
    entries = result.unique().all()
    
    activities = []
    for entry in entries:
        driver_name = entry.driver.username if entry.driver else "Unknown Driver"
        buyer_name = entry.buyer.name if entry.buyer else entry.adhoc_buyer_name or "Unknown Buyer"
        
        # Calculate total delivered for the message
        total_full = sum(item.full_delivered for item in entry.items)
        
        # Determine if it's primarily a delivery or a collection
        if total_full > 0:
            act_type = 'delivery'
            msg = f"Driver {driver_name} delivered {total_full} items to {buyer_name}"
            amt = float(entry.total_bill_amount)
        elif entry.cash_collected > 0 or entry.upi_collected > 0:
            act_type = 'collection'
            msg = f"Driver {driver_name} collected payment from {buyer_name}"
            amt = float(entry.cash_collected + entry.upi_collected)
        else:
            act_type = 'delivery'
            msg = f"Driver {driver_name} recorded empty receipt from {buyer_name}"
            amt = 0.0
            
        activities.append(
            RecentActivityOut(
                id=entry.id,
                type=act_type,
                message=msg,
                timestamp=entry.timestamp.isoformat(),
                amount=amt,
            )
        )
        
    return activities
