from uuid import UUID
from typing import Optional
from sqlalchemy import String, Numeric, Integer, Boolean, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from .base import BaseModelMixin
from ..core.ids import UUID_SQL_TYPE, uuid7
from app.db.database import Base

class Provider(Base, BaseModelMixin):
    __tablename__ = "providers"
    __table_args__ = {"schema": "tenant"}

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, default=uuid7, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    balance_pending: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    cylinders_pending: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
