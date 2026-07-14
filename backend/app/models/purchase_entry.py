from uuid import UUID
from sqlalchemy import Uuid, Integer, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .base import BaseModelMixin
from ..core.ids import UUID_SQL_TYPE, uuid7
from app.db.database import Base

class PurchaseEntry(Base, BaseModelMixin):
    __tablename__ = "purchase_entries"
    __table_args__ = {"schema": "tenant"}

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, default=uuid7, index=True)
    provider_id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, ForeignKey("tenant.providers.id"), nullable=False, index=True)
    item_id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, ForeignKey("tenant.items.id"), nullable=False, index=True)
    
    full_received: Mapped[int] = mapped_column(Integer, default=0)
    empty_returned: Mapped[int] = mapped_column(Integer, default=0)
    
    total_cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    amount_paid: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
