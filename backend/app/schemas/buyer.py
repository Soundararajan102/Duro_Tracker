from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import BuyerType
from .inventory import InventoryItem


class BuyerBase(BaseModel):
    name: str
    phone: str | None = None
    type: BuyerType
    address: str | None = None
    price_per_kg: float | None = Field(default=None, ge=0.0)
    is_active: bool = True


class BuyerCreate(BuyerBase):
    balance_pending: float = 0.0
    inventory: list[InventoryItem] | None = None


class BuyerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    type: BuyerType | None = None
    address: str | None = None
    price_per_kg: float | None = Field(default=None, ge=0.0)
    balance_pending: float | None = None
    inventory: list[InventoryItem] | None = None
    is_active: bool | None = None


class BuyerOut(BuyerBase):
    id: UUID
    balance_pending: float
    inventory: list[InventoryItem] = []

    model_config = ConfigDict(from_attributes=True)
