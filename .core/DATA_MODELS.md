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

### [2026-07-14 16:48:00] Phase 5 Data Models Tracking
**Provider Model (`providers`)**
- Tracks suppliers that sell items to the tenant.
- Fields: `id`, `name`, `phone`, `balance_pending` (monetary balance owed), `cylinders_pending` (empty cylinder count owed).

**Purchase Entry Model (`purchase_entries`)**
- Tracks inbound asset acquisitions.
- Fields: `provider_id`, `item_id`, `full_received`, `empty_returned`, `total_cost`, `amount_paid`.
- Relationship logic: Automatically increments `Item.current_full`, decrements `Item.current_empty`, and adjusts `Provider.balance_pending`.
