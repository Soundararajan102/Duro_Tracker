from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DeliveryEntryCreate(BaseModel):
    buyer_id: UUID | None = None
    adhoc_buyer_name: str | None = None
    item_id: UUID
    full_delivered: int = 0
    empty_received: int = 0
    cash_collected: float = 0
    upi_collected: float = 0


class DeliveryEntryOut(BaseModel):
    id: UUID
    driver_id: UUID
    buyer_id: UUID | None
    adhoc_buyer_name: str | None = None
    item_id: UUID
    idempotency_key: str | None = None
    
    unit_price_at_delivery: float
    total_bill_amount: float
    
    full_delivered: int
    empty_received: int
    cash_collected: float
    upi_collected: float
    
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
