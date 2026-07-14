from uuid import UUID

from pydantic import BaseModel, ConfigDict
from app.models.enums import BuyerType


class BuyerBase(BaseModel):
    name: str
    phone: str | None = None
    type: BuyerType
    address: str | None = None
    is_active: bool = True


class BuyerCreate(BuyerBase):
    pass


class BuyerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    type: BuyerType | None = None
    address: str | None = None
    is_active: bool | None = None


class BuyerOut(BuyerBase):
    id: UUID
    organization_id: UUID
    balance_pending: float
    cylinders_pending: int

    model_config = ConfigDict(from_attributes=True)
