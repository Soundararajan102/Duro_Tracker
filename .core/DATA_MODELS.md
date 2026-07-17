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
