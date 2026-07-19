from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

class PurchaseEntryBase(BaseModel):
    item_id: UUID
    full_received: int = Field(default=0, ge=0)
    empty_returned: int = Field(default=0, ge=0)
    total_cost: float = Field(default=0.0, ge=0.0)

class PurchaseEntryCreate(PurchaseEntryBase):
    pass

class PurchaseEntryOut(PurchaseEntryBase):
    id: UUID
    purchase_bill_id: UUID

    model_config = ConfigDict(from_attributes=True)

class PurchaseBillBase(BaseModel):
    provider_id: UUID
    bill_number: str | None = None
    total_cost: float = Field(default=0.0, ge=0.0)
    amount_paid: float = Field(default=0.0, ge=0.0)

class PurchaseBillCreate(PurchaseBillBase):
    items: list[PurchaseEntryCreate]

class PurchaseBillOut(PurchaseBillBase):
    id: UUID
    created_at: datetime
    entries: list[PurchaseEntryOut] = []

    model_config = ConfigDict(from_attributes=True)
