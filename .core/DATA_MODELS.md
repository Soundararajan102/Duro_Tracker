# Data Models & Core Functions

## Data Models Changes Log
*Note: Each time the data models change, append the change in this section with a timestamp. NEVER overwrite historical models.*

### [2026-07-13 14:20:00] Initial Duro Tracker Cylinder Models Tracked

## Database Operations
To be defined.

### Key Components
To be defined.

### Module Data Models
Below is the list of models tracked in the Duro Tracker Cylinder system:

(Empty list)

### [2026-07-16 14:55:00] Complete Data Models Update

### Platform Level Models (`public` schema)
**Organization Model (`organizations`)**
- Represents a tenant (Gas Agency).
- Fields: `id`, `name`, `max_users`, `created_at`.
- Relationships: `users`.

**User Model (`users`)**
- Represents users across all roles and tenants.
- Fields: `id`, `username`, `password_hash`, `role` (Enum: SUPER_ADMIN, TENANT_ADMIN, DRIVER), `organization_id`, `is_active`, `last_login_at`.
- Relationships: `organization`, `deliveries`.

### Tenant Level Models (`tenant_XXX` schema)
**Item Model (`items`)**
- Tracks cylinder types and their inventory.
- Fields: `id`, `name`, `capacity_kg` (Decimal), `current_full`, `current_empty`.

**Provider Model (`providers`)**
- Tracks suppliers that sell items to the tenant.
- Fields: `id`, `name`, `phone`, `balance_pending`, `cylinders_pending`.
- Relationships: `purchases`.

**Purchase Entry Model (`purchase_entries`)**
- Tracks inbound asset acquisitions from providers.
- Fields: `id`, `provider_id`, `item_id`, `full_received`, `empty_returned`, `total_cost`, `amount_paid`, `created_at`.
- Logic: Adjusts `Item.current_full/empty` and `Provider.balance_pending`.

**Buyer Model (`buyers`)**
- Tracks customers purchasing from the agency.
- Fields: `id`, `name`, `phone`, `address`, `price_per_kg` (Decimal), `balance_pending`, `cylinders_pending`.
- Relationships: `deliveries`.

**Delivery Model (`deliveries`)**
- Tracks outbound deliveries to buyers.
- Fields: `id`, `buyer_id`, `driver_id`, `status` (Enum: PENDING, IN_PROGRESS, COMPLETED, CANCELLED), `total_amount`, `amount_paid`, `created_at`.
- Relationships: `buyer`, `driver`, `items` (DeliveryItem).

**Delivery Item Model (`delivery_items`)**
- Tracks specific items delivered in a delivery.
- Fields: `id`, `delivery_id`, `item_id`, `full_delivered`, `empty_received`, `subtotal`.

### [2026-07-18 11:10:00] Purchase Bill Architecture Update

**Purchase Bill Model (`purchase_bills`)**
- Parent record for batch purchase transactions from providers.
- Fields: `id`, `provider_id`, `bill_number` (String, nullable), `total_cost` (Numeric), `amount_paid` (Numeric), `created_at`, `updated_at`.
- Relationships: `entries` (PurchaseEntry).
- Logic: The total cost and amount paid apply to the entire bill, and the provider's `balance_pending` is updated based on this bill.

**Purchase Entry Model (`purchase_entries`) (Updated)**
- Now acts as a line item for a `PurchaseBill`.
- Fields: `id`, `purchase_bill_id`, `item_id`, `full_received`, `empty_returned`, `total_cost`.
- Logic: `amount_paid` and `provider_id` are no longer present on individual line items.


### [2026-07-19 06:51:19] Complete Source Code of Data Models

*The following section contains the literal Python code blocks for every model in the system for deep technical reference.*

#### `base.py`
```python
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column


class BaseModelMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

```

#### `buyer.py`
```python
from uuid import UUID

from sqlalchemy import Boolean, Enum, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.ids import UUID_SQL_TYPE, uuid7
from ..db.database import Base
from .base import BaseModelMixin
from .enums import BuyerType


class Buyer(Base, BaseModelMixin):
    __tablename__ = "buyers"
    __table_args__ = {"schema": "tenant"}

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, index=True, default=uuid7)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    type: Mapped[BuyerType] = mapped_column(Enum(BuyerType), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    price_per_kg: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Financial debt
    balance_pending: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    # Physical asset debt
    cylinders_pending: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    deliveries = relationship("DeliveryEntry", back_populates="buyer")

```

#### `delivery.py`
```python
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
    driver_id: Mapped[UUID | None] = mapped_column(
        UUID_SQL_TYPE, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    buyer_id: Mapped[UUID | None] = mapped_column(
        UUID_SQL_TYPE, ForeignKey("tenant.buyers.id", ondelete="SET NULL"), index=True, nullable=True
    )
    adhoc_buyer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    item_id: Mapped[UUID] = mapped_column(
        UUID_SQL_TYPE, ForeignKey("tenant.items.id"), index=True, nullable=False
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

```

#### `enums.py`
```python
from enum import Enum


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    TENANT_ADMIN = "tenant_admin"
    DRIVER = "driver"


class ItemCategory(str, Enum):
    COMMERCIAL = "commercial"
    DOMESTIC = "domestic"
    RETAIL = "retail"


class BuyerType(str, Enum):
    COMMERCIAL = "commercial"
    DOMESTIC = "domestic"

```

#### `item.py`
```python
from uuid import UUID

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.ids import UUID_SQL_TYPE, uuid7
from ..db.database import Base
from .base import BaseModelMixin
from .enums import ItemCategory


class Item(Base, BaseModelMixin):
    __tablename__ = "items"
    __table_args__ = {"schema": "tenant"}

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, index=True, default=uuid7)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[ItemCategory] = mapped_column(Enum(ItemCategory), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    capacity_kg: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Base snapshot
    initial_full: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    initial_empty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Running totals for fast dashboard queries
    current_full: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_empty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    deliveries = relationship("DeliveryEntry", back_populates="item")

```

#### `organization.py`
```python
from uuid import UUID

from sqlalchemy import Index, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.ids import UUID_SQL_TYPE, uuid7
from ..db.database import Base
from .base import BaseModelMixin


class Organization(Base, BaseModelMixin):
    __tablename__ = "organizations"

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, index=True, default=uuid7)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    max_users: Mapped[int] = mapped_column(Integer, default=10, nullable=False)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")

```

#### `provider.py`
```python
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
    gstin: Mapped[Optional[str]] = mapped_column(String(50))
    price_per_kg: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    balance_pending: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    cylinders_pending: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

```

#### `purchase_bill.py`
```python
from uuid import UUID
from sqlalchemy import Uuid, Integer, Numeric, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModelMixin
from typing import TYPE_CHECKING
from ..core.ids import UUID_SQL_TYPE, uuid7
from app.db.database import Base

if TYPE_CHECKING:
    from .purchase_entry import PurchaseEntry

class PurchaseBill(Base, BaseModelMixin):
    __tablename__ = "purchase_bills"
    __table_args__ = {"schema": "tenant"}

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, default=uuid7, index=True)
    provider_id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, ForeignKey("tenant.providers.id"), nullable=False, index=True)
    
    bill_number: Mapped[str | None] = mapped_column(String, nullable=True)
    
    total_cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    amount_paid: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    
    # Relationship to entries
    entries: Mapped[list["PurchaseEntry"]] = relationship("PurchaseEntry", back_populates="bill", cascade="all, delete-orphan", lazy="selectin")

```

#### `purchase_entry.py`
```python
from uuid import UUID
from sqlalchemy import Uuid, Integer, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import BaseModelMixin
from ..core.ids import UUID_SQL_TYPE, uuid7
from app.db.database import Base

class PurchaseEntry(Base, BaseModelMixin):
    __tablename__ = "purchase_entries"
    __table_args__ = {"schema": "tenant"}

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, default=uuid7, index=True)
    purchase_bill_id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, ForeignKey("tenant.purchase_bills.id"), nullable=False, index=True)
    item_id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, ForeignKey("tenant.items.id"), nullable=False, index=True)
    
    full_received: Mapped[int] = mapped_column(Integer, default=0)
    empty_returned: Mapped[int] = mapped_column(Integer, default=0)
    
    total_cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    
    bill: Mapped["PurchaseBill"] = relationship("PurchaseBill", back_populates="entries")

```

#### `user.py`
```python
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    column,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.ids import UUID_SQL_TYPE, uuid7
from ..db.database import Base
from .base import BaseModelMixin
from .enums import UserRole


class User(Base, BaseModelMixin):
    __tablename__ = "users"
    __table_args__ = (
        Index(
            "ix_users_org_role_active",
            "organization_id",
            "role",
            "is_active",
        ),
        Index(
            "uq_users_username",
            func.lower(column("username")),
            unique=True,
        ),
    )

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, index=True, default=uuid7)
    username: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    organization_id: Mapped[UUID | None] = mapped_column(
        UUID_SQL_TYPE,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="users")
    deliveries = relationship("DeliveryEntry", back_populates="driver")

```


### [2026-07-19 07:30:30] Delivery Batching Schema Refactor
- **Removed:** DeliveryEntry model (flattened structure).
- **Added:** DeliveryBill (parent) and DeliveryItem (child) to allow multiple cylinder types in a single invoice.

### [2026-07-19 18:32:00] Per-Item Inventory Migration
**Buyer Model (uyers) (Updated)**
- Removed cylinders_pending.
- Added relationship inventory -> BuyerInventory.

**BuyerInventory Model (uyer_inventory) (New)**
- Tracks exact empties owed by a buyer per item.
- Fields: id, uyer_id, item_id, current_empty.

**Provider Model (providers) (Updated)**
- Removed cylinders_pending.
- Added relationship inventory -> ProviderInventory.

**ProviderInventory Model (provider_inventory) (New)**
- Tracks exact empties owed to a provider per item.
- Fields: id, provider_id, item_id, current_empty.

### [2026-07-21 20:08:00] New Architecture
Added \uyer_holding_snapshot: int | None\ to the \DeliveryItem\ table to persistently snapshot the amount of cylinders the buyer held right after the delivery transaction.

### [2026-07-21 20:50:00] BuyerPayment Model
Added \BuyerPayment\ table in tenant schema to strictly track standalone debt collections (cash/UPI), isolated from cylinder \DeliveryBill\s.
