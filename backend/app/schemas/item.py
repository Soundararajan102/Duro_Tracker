from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import ItemCategory


class ItemBase(BaseModel):
    name: str
    category: ItemCategory
    price: float = Field(ge=0.0)
    capacity_kg: float | None = Field(default=None, ge=0.0)
    initial_full: int = Field(default=0, ge=0)
    initial_empty: int = Field(default=0, ge=0)
    is_active: bool = True


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = None
    category: ItemCategory | None = None
    price: float | None = Field(default=None, ge=0.0)
    capacity_kg: float | None = Field(default=None, ge=0.0)
    current_full: int | None = Field(default=None, ge=0)
    current_empty: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ItemOut(ItemBase):
    id: UUID
    current_full: int
    current_empty: int

    model_config = ConfigDict(from_attributes=True)
