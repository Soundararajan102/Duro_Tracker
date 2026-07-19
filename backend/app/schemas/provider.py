from uuid import UUID
from pydantic import BaseModel, ConfigDict

class ProviderBase(BaseModel):
    name: str
    phone: str | None = None
    gstin: str | None = None
    price_per_kg: float | None = None
    is_active: bool = True

class ProviderCreate(ProviderBase):
    balance_pending: float = 0.0
    cylinders_pending: int = 0

class ProviderUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    gstin: str | None = None
    price_per_kg: float | None = None
    is_active: bool | None = None
    balance_pending: float | None = None
    cylinders_pending: int | None = None

class ProviderOut(ProviderBase):
    id: UUID
    balance_pending: float
    cylinders_pending: int

    model_config = ConfigDict(from_attributes=True)
