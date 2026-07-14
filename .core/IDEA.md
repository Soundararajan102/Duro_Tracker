# Project Ideas & Thoughts Log

*Note: Add your thoughts, ideas, and feature requests here sequentially. The AI assistant will read these to understand your plan and analyze the requirements.*

## Ideas Log

### [2026-07-13 20:06:00] Initial Thoughts
[Write down your initial ideas, goals, features, or anything else about the project here.]

### [2026-07-13 20:17:00] Core Concept and Target Client
- **Target Client**: Cylinder agency owner / distributor.
- **Company Name**: "Sree Hari Gas Agencies".
- **Core Functionality**: Track and manage end-to-end flow, including inventory, expenses, billing, etc.
- **Next Steps**: Copy the tech stack, frontend, and backend structure from another project (Duro_POS). The full flow and detailed idea will be provided once the base structure is set up.

### [2026-07-13 20:27:00] Frontend & Tech Stack Strategy
- **Frontend Generation**: Will be generated using Google Stitch and exported through Google AI Studio or provided as raw HTML design.
- **Frontend Framework**: Expo (React Native).
- **Tech Stack & Packages**: We will reuse the packages, dependencies, and overall tech stack from the `Duro_POS` project.
- **Detailed Flow**: The detailed project flow will be provided by the user later.

### [2026-07-13 20:30:00] Scaffold Constraints
- **CRITICAL CONSTRAINT**: Do NOT copy any actual business logic or code from `Duro_POS`. 
- **Actionable Scope**: We are only extracting the directory structures, configuration files, libraries, and package dependencies (like `package.json`, `pyproject.toml`) to ensure a clean slate for Sree Hari Gas Agencies.

### [2026-07-13 20:54:00] Gas Agency Distribution App - Implementation Plan
- **Admin Side**: Dashboard, Retailer Management, Pricing History, Ledger, Delivery Login Creation, Purchase Agencies (Inbound), Reports Module.
- **Delivery Side (Distributor)**: Mobile-first. Dashboard/Route, New Delivery/Checkout (with Opening Balance tracking), Payment Collection (Cash/UPI/Balance), Bluetooth Thermal Receipt Printing.
- **Key Concepts Validated**: Maintaining a running ledger (Opening/Closing balances) at the point of delivery for retailers. Separation of admin and distributor roles.
- *Detailed flow is stored in the project history and will be formalized into `DATA_MODELS.md` during implementation.*

---
*(Add new ideas below using the `### [YYYY-MM-DD HH:mm:ss] Title` format)*

### [2026-07-13 21:55:00] Multi-Tenant Architecture & Data Models
- **Idea/Concept:** Implement a robust multi-tenant structure to support multiple gas agencies.
- **Roles:**
  - `superadmin`: Full platform control (us).
  - `admin`: The clients (e.g., Sree Hari Gas Agencies owners).
  - `delivery`: The field users entering the billing data.
- **Structural Upgrade from Duro_POS:** Unlike Duro_POS, which lacked a strict database-level tenancy architecture, this new project will introduce an `agencies` table. Every user (except superadmin), inventory item, retailer, purchase, and delivery will have a hard foreign key (`agency_id`) mapping it to a specific agency. This guarantees data isolation between clients.

### [2026-07-13 22:04:00] Schema Enhancements & Hierarchy
- **Idea/Concept:** Implement a `products` table instead of hardcoded cylinder types, and split deliveries into `deliveries` (header) and `delivery_items` (line items) to allow multiple product types in a single drop-off.
- **Hierarchy Confirmation:** Confirmed the structural flow is Superadmin -> Admin (Agency Tenant) -> User (Delivery).

### [2026-07-13 22:12:00] FULL Backend Data Models (Saved for later)
- **Status:** This is the detailed schema plan to be reused later. We are focusing on frontend design first.
- **Multi-Tenancy Justification:** I reviewed the `Duro_POS` database structure via Postgres. In `Duro_POS`, the `users` table utilizes a `role` column (which handles roles like admin vs user). However, to properly support a scalable Multi-Tenant SaaS for Gas Agencies, we need to introduce a "Tenant" (Agency) level to the hierarchy. In `Duro_POS`, all data is stored together without a strict tenant ID. For this Gas Agency project, I strongly recommend adding an `agency_id` to almost every table. This ensures that when an Admin (client) logs in, they ONLY see their own agency's stock, retailers, and delivery users. Superadmins will have access to all agencies.
- **Proposed Database Models:**

#### 1. `agencies` (The Tenant)
- `id`: Primary Key
- `name`: String (e.g., "Sree Hari Gas Agencies")
- `address`: String
- `phone`: String
- `status`: String (Active/Inactive)
- `created_at`: DateTime

#### 2. `users` (Superadmin, Admin, Delivery)
- `id`: Primary Key
- `email`: String (Unique)
- `hashed_password`: String
- `full_name`: String
- `role`: Enum (`superadmin`, `admin`, `delivery`)
- `agency_id`: ForeignKey (`agencies.id` - Nullable for superadmin)
- `is_active`: Boolean
- `created_at`: DateTime

#### 3. `products` (Catalog of Cylinders & Accessories)
- `id`: Primary Key
- `agency_id`: ForeignKey (`agencies.id` - Nullable for global defaults)
- `sku_name`: String (e.g., "19kg Commercial Cylinder")
- `category`: Enum (`refill`, `new_connection`, `accessory`)
- `unit_price`: Decimal (Current selling price)
- `empty_return_required`: Boolean (True for gas refills, False for stoves/hoses)
- `is_active`: Boolean

#### 4. `retailers` (The Customers/Shops)
- `id`: Primary Key
- `agency_id`: ForeignKey (`agencies.id`)
- `name`: String
- `phone`: String
- `address`: String
- `current_balance`: Decimal (Running ledger outstanding balance)
- `created_at`: DateTime

#### 5. `inventory` (Live Stock Snapshot)
- `id`: Primary Key
- `agency_id`: ForeignKey (`agencies.id`)
- `product_id`: ForeignKey (`products.id`)
- `full_cylinders`: Integer
- `empty_cylinders`: Integer
- `defective_cylinders`: Integer
- `updated_at`: DateTime
- **Constraint:** `UNIQUE(agency_id, product_id)`

#### 6. `suppliers` (Admin Side - Purchase Agencies)
- `id`: Primary Key
- `agency_id`: ForeignKey (`agencies.id`)
- `name`: String
- `phone`: String
- `created_at`: DateTime

#### 7. `purchases` (Admin Side - Inbound Stock)
- `id`: Primary Key
- `agency_id`: ForeignKey (`agencies.id`)
- `supplier_id`: ForeignKey (`suppliers.id`)
- `product_id`: ForeignKey (`products.id`)
- `quantity_received`: Integer
- `total_cost`: Decimal
- `date`: DateTime

#### 8. `deliveries` (Outbound Billing Header / Invoice)
- `id`: Primary Key
- `agency_id`: ForeignKey (`agencies.id`)
- `delivery_user_id`: ForeignKey (`users.id`)
- `retailer_id`: ForeignKey (`retailers.id`)
- `total_amount_billed`: Decimal (Sum of all items)
- `cash_collected`: Decimal
- `upi_collected`: Decimal
- `payment_status`: Enum (`paid`, `partial`, `unpaid`)
- `delivered_at`: DateTime

#### 9. `delivery_items` (Specific Products in a Delivery)
- `id`: Primary Key
- `delivery_id`: ForeignKey (`deliveries.id`)
- `product_id`: ForeignKey (`products.id`)
- `quantity_delivered`: Integer
- `empty_returned`: Integer
- `unit_price_applied`: Decimal (Snapshot of price at moment of sale)
- `line_total`: Decimal

### [2026-07-13 22:12:00] New Strategy: Frontend-First Approach
- **Decision:** Design the frontend fully (or halfway) using Google Stitch/AI Studio/HTML before writing backend code or locking in tables. This allows us to visualize the app and discover exact data requirements organically.

### [2026-07-13 22:57:00] Admin Frontend UI Refinements & Page Flows
- **Aesthetics:** Light theme (white background) only.
- **SaaS Branding:** Generic branding to support multiple clients; no hardcoded agency names.
- **Page 1: Items Management:** Clients must be able to add the items (cylinder Kg variants) they sell. These items are required to generate bills later.
- **Page 2: Purchases (Inbound):** Log purchases from providers/suppliers. Track total purchased and the outstanding balance *owed* to the provider.
- **Page 3: Inventory:** View the current live stock count of each item.
- **Page 4: Sales:** View the daily bills generated by delivery users, with custom view/filter capabilities.
- **Page 5: Dashboard:** A high-level overview.
- **Page 6: Settings:** Dedicated area to create delivery users, set passwords, AND view Reports. (Merged Reports into Settings for a cleaner sidebar, similar to Duro_POS structure).

### [2026-07-14 13:42:00] Backend Architecture & Roles
- **Idea:** Build the Duro_Tracker backend using the Duro_POS boilerplate (FastAPI + PostgreSQL).
- **Roles:** Super Admin (Durozen), Tenant Admin (Agency Owner), Driver (Entry Staff).
- **Goal:** Track cylinder flow and cash/UPI collection per driver, giving the Tenant Admin a consolidated dashboard.

### [2026-07-14 13:51:00] Backend Data Model Refinements
- **Idea:** Track running totals directly on the Item table (`current_full`, `current_empty`) for fast dashboard queries, rather than calculating on the fly.
- **Idea:** Ensure pricing snapshot (`unit_price_at_delivery`, `total_bill_amount`) is captured directly on `DeliveryEntry` so past entries aren't corrupted by future price updates.
- **Idea:** Enforce Multi-tenant isolation rigidly at the FastAPI dependency layer (reading `organization_id` from JWT).
- **Idea:** Keep standard `.env.example` configurations agnostic for standard Docker DB spins. Wrap operational endpoints (inventory + balance changes) in single ACID transactions.

### [2026-07-14 15:05:37] Architectural Pivot: Schema-per-Tenant, Offline Mode, & Testing
- **User Request:** Revert to schema-per-tenant (Super Admin in public schema), add dhoc_buyer_name to DeliveryEntry, implement Idempotency keys & offline queueing in frontend, use React Query for caching, and implement FastAPI TestClient for integration/unit testing.
- **Agent Analysis:** This is a significant architectural pivot. 
  1. **Schema-per-tenant:** We will need to restore the PostgreSQL schema routing logic (set_search_path) and separate global tables (User, Organization) in public from tenant tables (Item, Buyer, DeliveryEntry) in 	enant_<id> schemas.
  2. **Ad-Hoc Deliveries:** Adding dhoc_buyer_name to DeliveryEntry solves the walk-in customer problem cleanly without polluting the CRM.
  3. **Idempotency & Offline:** X-Idempotency-Key is a highly professional addition for unreliable networks. The backend will need an IdempotencyKey tracking mechanism (or unique constraint) to prevent double-processing.
  4. **State Caching:** Combining Axios with @tanstack/react-query will make the dashboard instantaneous.
