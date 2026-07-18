from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class PurchaseEntryBase(BaseModel):
    provider_id: UUID
    item_id: UUID
    full_received: int = Field(default=0, ge=0)
    empty_returned: int = Field(default=0, ge=0)
    total_cost: float = Field(default=0.0, ge=0.0)
    amount_paid: float = Field(default=0.0, ge=0.0)

class PurchaseEntryCreate(PurchaseEntryBase):
    pass

class PurchaseEntryOut(PurchaseEntryBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
