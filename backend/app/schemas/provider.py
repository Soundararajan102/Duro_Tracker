from uuid import UUID
from pydantic import BaseModel, ConfigDict

class ProviderBase(BaseModel):
    name: str
    phone: str | None = None
    gstin: str | None = None
    is_active: bool = True

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    gstin: str | None = None
    is_active: bool | None = None

class ProviderOut(ProviderBase):
    id: UUID
    balance_pending: float
    cylinders_pending: int

    model_config = ConfigDict(from_attributes=True)
