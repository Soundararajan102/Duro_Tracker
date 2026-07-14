import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_tenant_admin, get_tenant_db
from app.db.session import get_platform_db
from app.models import DeliveryEntry, Item, User

router = APIRouter(dependencies=[Depends(require_tenant_admin())])

class DashboardMetrics(BaseModel):
    total_dispatched: int
    total_empty_received: int
    total_cash_collected: float
    total_upi_collected: float

@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    current_user: User = Depends(require_tenant_admin()),
    db: AsyncSession = Depends(get_tenant_db),
):
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="No organization")
        
    org_id = current_user.organization_id
    
    # Aggregate from DeliveryEntry
    result = await db.execute(
        select(
            func.coalesce(func.sum(DeliveryEntry.full_delivered), 0),
            func.coalesce(func.sum(DeliveryEntry.empty_received), 0),
            func.coalesce(func.sum(DeliveryEntry.cash_collected), 0),
            func.coalesce(func.sum(DeliveryEntry.upi_collected), 0),
        )
    )
    row = result.fetchone()
    
    return DashboardMetrics(
        total_dispatched=row[0],
        total_empty_received=row[1],
        total_cash_collected=row[2],
        total_upi_collected=row[3],
    )
