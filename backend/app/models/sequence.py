from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db.database import Base


class TenantSequence(Base):
    """
    A simple table to handle sequential counters in a concurrency-safe way,
    per tenant, isolated in the tenant schema.
    """
    __tablename__ = "sequences"
    __table_args__ = {"schema": "tenant"}

    name: Mapped[str] = mapped_column(String(50), primary_key=True)
    last_value: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
