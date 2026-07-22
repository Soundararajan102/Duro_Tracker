from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.buyer import BuyerSummary
from app.schemas.item import ItemOut


class DeliveryItemCreate(BaseModel):
    item_id: UUID
    full_delivered: int = Field(default=0, ge=0)
    empty_received: int = Field(default=0, ge=0)


class DeliveryBillCreate(BaseModel):
    buyer_id: UUID | None = None
    adhoc_buyer_name: str | None = None
    items: list[DeliveryItemCreate]
    cash_collected: float = Field(default=0.0, ge=0.0)
    upi_collected: float = Field(default=0.0, ge=0.0)
    timestamp: datetime | None = None


class DebtCollectionCreate(BaseModel):
    buyer_id: UUID
    cash_collected: float = Field(default=0.0, ge=0.0)
    upi_collected: float = Field(default=0.0, ge=0.0)
    timestamp: datetime | None = None


class DeliveryItemOut(BaseModel):
    id: UUID
    item_id: UUID
    unit_price_at_delivery: float
    line_total_amount: float
    full_delivered: int
    empty_received: int
    buyer_holding_snapshot: int | None = None
    item: ItemOut | None = None
    
    model_config = ConfigDict(from_attributes=True)


class DeliveryBillOut(BaseModel):
    id: UUID
    driver_id: UUID | None
    buyer_id: UUID | None
    adhoc_buyer_name: str | None = None
    bill_number: str | None = None
    idempotency_key: str | None = None
    buyer: BuyerSummary | None = None
    
    total_bill_amount: float
    cash_collected: float
    upi_collected: float
    opening_balance: float | None = None
    closing_balance: float | None = None
    
    items: list[DeliveryItemOut] = []
    
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
