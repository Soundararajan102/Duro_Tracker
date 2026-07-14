from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.ids import UUID_SQL_TYPE, uuid7
from ..db.database import Base
from .base import BaseModelMixin


class DeliveryEntry(Base, BaseModelMixin):
    __tablename__ = "delivery_entries"
    __table_args__ = {"schema": "tenant"}

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, index=True, default=uuid7)
    driver_id: Mapped[UUID] = mapped_column(
        UUID_SQL_TYPE, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    buyer_id: Mapped[UUID | None] = mapped_column(
        UUID_SQL_TYPE, ForeignKey("tenant.buyers.id", ondelete="SET NULL"), index=True, nullable=True
    )
    adhoc_buyer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    item_id: Mapped[UUID] = mapped_column(
        UUID_SQL_TYPE, ForeignKey("tenant.items.id", ondelete="CASCADE"), index=True, nullable=False
    )
    idempotency_key: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    
    # Pricing snapshot to avoid historical corruption
    unit_price_at_delivery: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_bill_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Physical movement
    full_delivered: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    empty_received: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Financial movement
    cash_collected: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    upi_collected: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    driver = relationship("User")
    buyer = relationship("Buyer", back_populates="deliveries")
    item = relationship("Item", back_populates="deliveries")
