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
├── .core/                    # Project Documentation & Historical Logs (Rules, Architecture, Chat Log)
├── .agents/                  # Agent Context and Guidelines (.env for GitHub PAT, AGENTS.md)
├── .github/                  # GitHub Actions Workflows (Android build CI)
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database Migrations
│   ├── app/                  # Main Python Application
│   │   ├── api/              # API Routers (v1, admin, driver, super-admin)
│   │   ├── auth/             # JWT, Dependencies, TenantContext
│   │   ├── core/             # Config, Security, Logging, Middleware, Dependency Injection
│   │   ├── db/               # Database Setup, Tenant Schema Routing, Sessions
│   │   └── models/           # SQLAlchemy Data Models
├── frontend/                 # React Native / Expo Application
│   ├── src/                  # Main Source Code
│   │   ├── api/              # React Query hooks and API clients
│   │   ├── components/       # Reusable UI components
│   │   ├── navigation/       # Stack and Tab navigators for roles
│   │   ├── screens/          # Screen components
│   │   └── types/            # TypeScript interfaces and types
│   ├── app.config.js         # Expo Configuration
│   └── package.json          # Node dependencies
```
