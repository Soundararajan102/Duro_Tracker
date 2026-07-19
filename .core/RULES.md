# Duro Tracker Coding Rules & Constraints

## 1. Python Backend (FastAPI)
- **Type Hinting:** Strictly use type hints for all function arguments and return types.
- **Dependency Management:** Use `uv` for resolving and installing Python packages.
- **Database Safety:** Handle database sessions safely, using dependency injection (`Depends`) properly. Ensure `AsyncSession` is used for all transactions.
- **Migrations:** All database schema changes MUST be tracked using Alembic. Never modify tables manually without a migration.

## 2. React Native / Expo Frontend
- **Language:** Write all components strictly in TypeScript (`.tsx`).
- **Styling:** Use NativeWind / Tailwind CSS as the primary styling solution. Tamagui is configured for base utility but prioritize Tailwind utility classes for UI.
- **State Management:** Use `React Query` for all API data fetching, caching, and mutation. Avoid heavy local component state for remote data.
- **Architecture:** Follow functional component patterns with React Hooks.

## 3. Business Logic Constraints (Gas Agency)
**CRITICAL RULE: DO NOT OVERCOMPLICATE INVENTORY OR CASH FLOW.**
- **No Transit Inventory:** Do not implement "Truck vs Warehouse" tracking. The agency only cares about the absolute total physical Full and Empty cylinders present in the facility or dropped at buyers.
- **No Driver Cash Settlements:** Do not track cash held by drivers over long periods. The financial flow is strictly macro: Total Paid to Providers (Purchases) vs Total Collected from Buyers (Deliveries).
- **Unified Pricing:** New connections and refills have the exact same price model. Do not build separate pricing structures.
- **Batch Processing:** Both Purchases and Deliveries are processed in multi-item batches (a parent bill with multiple line items).

## 4. Multi-Tenancy & Tenant Context
**CRITICAL RULE: RESPECT TENANT BOUNDARIES.**
- **Tenant Router:** Multi-tenancy is handled via PostgreSQL `search_path` routing using a schema-per-tenant architecture (e.g., `tenant_XXX`).
- **Global vs Tenant Models:** Models like `User` and `Organization` live in the `public` schema. All domain-specific models (Items, Buyers, Deliveries, Providers, PurchaseBills) live in the tenant schemas.
- **TenantContext Dependency:** API endpoints accessing tenant data must inject `TenantContext` via `Depends(get_tenant_context)`. Do not access tenant data without verifying the `organization_id` using `ctx.require_organization_id()`.

## 5. System Operations & CI/CD
**CRITICAL RULE: REPOSITORY DISCIPLINE.**
- **No Unprompted Pushes:** NEVER push to git or trigger GitHub Actions unless the user EXPLICITLY asks you to.
- **Manual CI:** The GitHub Action (APK build) should only be triggered manually (`workflow_dispatch`) to avoid wasting CI minutes.

## 6. Strict Documentation Preservation
**CRITICAL RULE: DO NOT ERASE HISTORY.**
- **Logging Mandate:** Every action, chat, and command must be appended to `SESSION_HISTORY.md` and `CHAT_LOG.md`.
- **Ideation:** All user features and conceptual thoughts must be added sequentially to `IDEA.md`.
- **Append Only:** When making architectural or database changes, append them to `ARCHITECTURE.md` and `DATA_MODELS.md` under a new timestamped header. Do not overwrite historical states.
