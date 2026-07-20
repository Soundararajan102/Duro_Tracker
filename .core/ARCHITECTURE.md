# Duro Tracker Cylinder Architecture

## Architectural Changes Log
*Note: Each time the architecture changes, append the change in this section with a timestamp. NEVER overwrite the historical architecture.*

### [2026-07-13 14:20:00] Initial Duro Tracker Cylinder Architecture Tracking

## Code Files & Folders Structure

```text
Duro_Tracker (Root)
└── .core/                    # Project Documentation & Rules
└── .agents/                  # Agent Context and Guidelines
```

## Application Type
To be defined.

## Stack Overview
To be defined.

### [2026-07-16 14:55:00] Complete Architecture Update

## Application Type
Multi-tenant B2B SaaS for Gas Agency Inventory and Cashflow Management. Mobile-first (Android APK).

## Stack Overview
- **Frontend**: React Native (Expo)
  - UI Styling: NativeWind / Tailwind CSS
  - State/Data Management: React Query
  - Navigation: Expo Router / React Navigation
- **Backend**: Python (FastAPI)
  - ORM: SQLAlchemy (Async)
  - Migrations: Alembic
  - Authentication: JWT with Role-Based Access Control (Super Admin, Tenant Admin, Driver)
- **Database**: PostgreSQL
  - Multi-tenancy Model: Schema per tenant (using PostgreSQL `search_path`)
- **CI/CD**: GitHub Actions
  - Workflows: Automated Android APK (`assembleDebug`) builds and artifacts upload

## Code Files & Folders Structure (Updated)

```text
Duro_Tracker (Root)
├── .agents/
│   ├── .env
│   └── AGENTS.md
├── .core/
│   ├── ADMIN_PLAN.md
│   ├── AGENT_COMMANDS.md
│   ├── ARCHITECTURE.md
│   ├── CHAT_LOG.md
│   ├── DATA_MODELS.md
│   ├── IDEA.md
│   ├── RULES.md
│   ├── SESSION_HISTORY.md
│   └── TEST_CREDENTIALS.md
├── .github/
│   └── workflows/
│       └── build-android.yml
├── .gitignore
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── app/
│   │   ├── __init__.py
│   │   ├── assets/
│   │   │   └── fonts/
│   │   │       ├── NotoSansTamil-Bold.ttf
│   │   │       └── NotoSansTamil-Regular.ttf
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── dependencies.py
│   │   │   └── tenant_context.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── deps.py
│   │   │   ├── errors.py
│   │   │   ├── ids.py
│   │   │   ├── logging.py
│   │   │   ├── middleware.py
│   │   │   ├── redis_cache.py
│   │   │   ├── security.py
│   │   │   └── timezone.py
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── database.py
│   │   │   ├── migration_repair.py
│   │   │   ├── postgres_url.py
│   │   │   ├── schema_guards.py
│   │   │   ├── session.py
│   │   │   ├── startup.py
│   │   │   ├── storage/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── images.py
│   │   │   │   ├── objects.py
│   │   │   │   └── paths.py
│   │   │   ├── tenant_context_var.py
│   │   │   ├── tenant_metadata.py
│   │   │   ├── tenant_schema.py
│   │   │   └── tenant_session.py
│   │   ├── main.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── buyer.py
│   │   │   ├── delivery.py
│   │   │   ├── enums.py
│   │   │   ├── item.py
│   │   │   ├── organization.py
│   │   │   ├── provider.py
│   │   │   ├── purchase_bill.py
│   │   │   ├── purchase_entry.py
│   │   │   └── user.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── driver.py
│   │   │   ├── health.py
│   │   │   ├── purchase.py
│   │   │   └── super_admin.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── admin/
│   │   │   │   └── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── buyer.py
│   │   │   ├── common.py
│   │   │   ├── delivery.py
│   │   │   ├── item.py
│   │   │   ├── organization.py
│   │   │   ├── provider.py
│   │   │   ├── purchase.py
│   │   │   ├── retailer_sale/
│   │   │   │   └── __init__.py
│   │   │   └── user.py
│   │   └── services/
│   │       └── reports/
│   │           ├── __init__.py
│   │           ├── pdf.py
│   │           └── queries.py
│   ├── docker-entrypoint.sh
│   ├── docker-gunicorn.sh
│   ├── manage.py
│   ├── migrations/
│   │   ├── README
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       ├── public/
│   │       │   ├── 04a28785668a_initial_public_schema.py
│   │       │   └── b235c2b39a61_cascade_delete_users.py
│   │       └── tenant/
│   │           ├── 1b9c76f7eb5e_add_price_per_kg_to_provider.py
│   │           ├── 4fbca79c1a42_add_gstin_to_provider.py
│   │           ├── 5e9f1a2b3c4d_add_purchase_bills.py
│   │           ├── 9f9b588b8687_prevent_item_cascade.py
│   │           ├── f84826d7025c_preserve_delivery_history.py
│   │           └── fcf867a39753_initial_tenant_schema.py
│   ├── pyproject.toml
│   ├── pytest.ini
│   ├── run_migrations.py
│   ├── scratch_db.py
│   ├── seed.py
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_driver_api.py
│   └── uv.lock
├── caddy/
│   ├── Caddyfile
│   └── Caddyfile.template
└── frontend/
    ├── .env
    ├── .gitignore
    ├── .npmrc
    ├── App.tsx
    ├── app.config.js
    ├── assets/
    │   └── Logo.png
    ├── babel.config.js
    ├── eas.json
    ├── eslint.config.js
    ├── global.css
    ├── global.d.ts
    ├── lock.yaml
    ├── metro.config.js
    ├── nativewind-env.d.ts
    ├── package-lock.json
    ├── package.json
    ├── scripts/
    │   ├── build-apk.sh
    │   ├── check-android-env.js
    │   ├── cleanup-bundled-native-deps.js
    │   ├── generate-android-icons.py
    │   ├── reset-project.js
    │   ├── run-android-dev.sh
    │   ├── run-android-usb.sh
    │   ├── start-android-dev-client.sh
    │   └── start-android-emulator.sh
    ├── src/
    │   ├── api/
    │   ├── auth/
    │   ├── components/
    │   │   └── PrinterSettingsModal.tsx
    │   ├── constants/
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── hooks/
    │   │   ├── use-receipt-image-print-job.tsx
    │   │   ├── useBuyers.ts
    │   │   ├── useDashboard.ts
    │   │   ├── useDrivers.ts
    │   │   ├── useItems.ts
    │   │   ├── usePurchases.ts
    │   │   └── useSuperAdmin.ts
    │   ├── locales/
    │   ├── navigation/
    │   │   ├── AdminTabNavigator.tsx
    │   │   ├── DriverTabNavigator.tsx
    │   │   ├── RootNavigator.tsx
    │   │   ├── SuperAdminDashboardStack.tsx
    │   │   └── SuperAdminTabNavigator.tsx
    │   ├── screens/
    │   │   ├── admin/
    │   │   │   ├── BuyersScreen.tsx
    │   │   │   ├── DashboardScreen.tsx
    │   │   │   ├── InventoryScreen.tsx
    │   │   │   ├── ItemsScreen.tsx
    │   │   │   ├── PurchasesScreen.tsx
    │   │   │   └── SettingsScreen.tsx
    │   │   ├── auth/
    │   │   │   └── LoginScreen.tsx
    │   │   ├── driver/
    │   │   │   ├── BillsScreen.tsx
    │   │   │   └── DeliveryScreen.tsx
    │   │   └── superadmin/
    │   │       ├── ManageOrganizationScreen.tsx
    │   │       ├── ManageUserScreen.tsx
    │   │       └── SuperAdminDashboard.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── store/
    │   │   └── printer-store.ts
    │   ├── types/
    │   │   ├── api.ts
    │   │   ├── haroldtran-react-native-thermal-printer.d.ts
    │   │   └── printer.ts
    │   └── utils/
    │       ├── printer-html.ts
    │       └── printer.ts
    ├── tailwind.config.js
    ├── tamagui.config.ts
    └── tsconfig.json
```

### [2026-07-19] Per-Item Inventory Tracking Architecture
- Transitioned from global integer-based empty cylinder tracking to granular per-item tracking.
- Dropped cylinders_pending from uyers and providers.
- Introduced uyer_inventory and provider_inventory to map users directly to items for isolated asset and liability tracking.
- Refactored DeliveryBill and PurchaseBill models to rely entirely on child items (DeliveryItem and PurchaseItem) for delta updates.
