from uuid import UUID
from pydantic import BaseModel, ConfigDict

class PurchaseEntryBase(BaseModel):
    provider_id: UUID
    item_id: UUID
    full_received: int = 0
    empty_returned: int = 0
    total_cost: float = 0.0
    amount_paid: float = 0.0

class PurchaseEntryCreate(PurchaseEntryBase):
    pass

class PurchaseEntryOut(PurchaseEntryBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
