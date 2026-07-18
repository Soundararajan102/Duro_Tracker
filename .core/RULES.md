# Duro Tracker Cylinder Coding Rules

## Python Backend (FastAPI)
- Strictly use type hints for all function arguments and return types.
- Follow PEP 8 guidelines.
- Use `uv` for dependency management.
- Handle database sessions safely, closing them or using dependency injection (`Depends`) properly.
- All database migrations must be tracked using Alembic.

## React Native / Expo Frontend
- Write all components in TypeScript (`.tsx`).
- Use Tamagui and Tailwind CSS for styling.
- Follow functional component patterns with React Hooks.
- Ensure cross-platform compatibility (iOS, Android, Web) where applicable via Expo.


## ?? BUSINESS LOGIC CONSTRAINTS (Gas Agency)
**CRITICAL RULE: DO NOT OVERCOMPLICATE INVENTORY OR CASH FLOW.**
1. **No Transit Inventory:** Do not implement "Truck vs Warehouse" tracking. The agency only cares about the absolute total physical Full/Empty cylinders.
2. **No Driver Cash Settlements:** Do not track cash held by drivers. The financial flow is strictly macro: Total Paid to Providers vs Total Collected from Buyers.
3. **Unified Pricing:** New connections and refills have the exact same price. Do not build separate pricing structures for them.

## Multi-Tenancy & Tenant Context
**CRITICAL RULE: RESPECT TENANT BOUNDARIES.**
1. **Tenant Router:** Multi-tenancy is handled via PostgreSQL `search_path` routing using a schema-per-tenant architecture (`tenant_XXX`).
2. **Global vs Tenant Models:** Models like `User` and `Organization` live in the `public` schema. All domain-specific models (Items, Buyers, Deliveries, Providers) live in the tenant schemas.
3. **TenantContext Dependency:** API endpoints accessing tenant data must inject `TenantContext` via `Depends(get_tenant_context)`. Do not access tenant data without verifying the `organization_id` using `ctx.require_organization_id()`.


## 🚨 MANDATORY ACTION: GIT PUSHES & GITHUB ACTIONS
**CRITICAL RULE: NEVER push to git or trigger GitHub Actions unless the user EXPLICITLY asks you to.**
The GitHub action should only be triggered manually (workflow_dispatch) to avoid wasting CI minutes.
