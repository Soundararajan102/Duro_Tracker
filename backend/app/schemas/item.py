from uuid import UUID

from pydantic import BaseModel, ConfigDict
from app.models.enums import ItemCategory


class ItemBase(BaseModel):
    name: str
    category: ItemCategory
    price: float
    capacity_kg: float | None = None
    initial_full: int = 0
    initial_empty: int = 0
    is_active: bool = True


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = None
    category: ItemCategory | None = None
    price: float | None = None
    capacity_kg: float | None = None
    current_full: int | None = None
    current_empty: int | None = None
    is_active: bool | None = None


class ItemOut(ItemBase):
    id: UUID
    current_full: int
    current_empty: int

    model_config = ConfigDict(from_attributes=True)
