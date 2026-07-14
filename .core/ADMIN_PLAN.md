# Admin Flow Implementation Plan

*This file will serve as the master document for tracking the development and full flow of the Admin side of the Duro Tracker Application.*

## What We Have Done Till Now
1. **Scaffolding:** Initialized empty `frontend` and `backend` structures, copying configuration files from `Duro_POS` while ensuring no old business logic was carried over.
2. **Environment Fixes:** Resolved npm package issues and TSConfig path errors.
3. **Database Architecture:** Designed a robust 9-table multi-tenant PostgreSQL schema (`agencies`, `users`, `products`, `retailers`, `inventory`, `suppliers`, `purchases`, `deliveries`, `delivery_items`).
4. **UI Strategy:** Decided on a Design-First (UI-Driven) approach with a crisp white/light theme.
5. **Core Navigation Mapping:** Identified the 6 primary screens required for the Admin Panel: Dashboard, Items Management, Purchases, Inventory, Sales, and Settings.

---

## 1. Dashboard (Overview)
- **Status:** Planning
- **Flow & Options:**
  - [ ] Top Metrics: Outstanding Balance, Today's Sales, Today's Collection
  - [ ] Charts: Revenue vs Collection
  - [ ] Recent Activity Feed

## 2. Items Management
- **Status:** Planning (Active)
- **Purpose:** To configure the product catalog (e.g., 5kg, 14.2kg Domestic, 19kg Commercial cylinders). These items are required to generate sales bills and track inventory.
- **Flow & Options:**
  - [ ] **Item List Table:** Display all added items with columns for SKU Name, Category, Default Price, and **Total Owned Cylinders** (Physical count).
  - [ ] **Add Item Button/Modal:** Inputs for `Item Name`, `Category`, `Default Unit Price`, **`Initial Full Cylinders`**, and **`Initial Empty Cylinders`** (e.g., "We start with 20 Full and 30 Empty").
  - [ ] **Edit Item Feature:** Ability to update the name or price of an existing item.
  - [ ] **Toggle Status:** Activate or Deactivate an item so it no longer shows up in new deliveries.

## 3. Purchases (Inbound)
- **Status:** Planning (Active)
- **Purpose:** To log incoming stock from different providers/suppliers and manage the financial balance owed to them.
- **Flow & Options:**
  - [ ] **Purchase Record Table:** Display all past purchases with columns for Date, Provider Name, Item Bought, Rate/Cost, Total Amount, Paid Amount, Payment Method, and Outstanding Balance.
  - [ ] **Record Purchase Button/Modal:** 
    - Select Provider/Supplier (Dropdown).
    - Select Item (Dropdown populated strictly from the "Items Management" page).
    - Input `Quantity of Full Cylinders Purchased`.
    - Input `Quantity of Empty Cylinders Returned` (given back to provider).
    - Input `Purchase Rate` (Cost per item).
    - Input `Amount Paid` and select `Payment Mode` (Cash or UPI).
    - Auto-calculate `Total Cost` and `Balance Owed`.
  - [ ] **Supplier Balance Tracking:** A view to see how much total balance is owed to each different provider.

## 4. Inventory (Live Stock)
- **Status:** Planning (Active)
- **Purpose:** To provide a real-time snapshot of gas cylinders, tracking what came in, what went out, and what is currently available.
- **Flow & Options:**
  - [ ] **Live Stock Grid/Table:** Display a list of all items.
  - [ ] **Full Cylinders (Ready to Sell):** Stock of filled gas cylinders.
  - [ ] **Empty Cylinders (Ready to Refill):** Stock of empty cylinders at the agency.
  - [ ] **Automated Calculation Rule:** 
    - *Selling/Billing* requires the driver to input both `Full Given` and `Empty Collected`. It reduces Full stock by `Full Given` and increases Empty stock by `Empty Collected`.
    - *Purchasing (Refilling)* reduces Empty stock and increases Full stock.
  - [ ] **Adjust Stock Button (Defective/Lost):** A modal to manually deduct a lost or broken cylinder from the system to keep physical counts accurate.

## 5. Buyers (Retailers & Sales)
- **Status:** Planning (Active)
- **Purpose:** To manage the shops/customers that buy from the agency and track their individual ledgers (CRM). Also provides a global view of all daily sales/bills.
- **Flow & Options:**
  - [ ] **Global Daily Bills View (All Sales):** A master list showing all sales/bills. Each bill explicitly shows **Full Cylinders Given** vs **Empty Cylinders Collected**.
  - [ ] **Buyer List Table:** Display all registered buyers/shops with columns for Shop Name, Owner Name, Contact, **Financial Balance Owed**, and **Cylinder Balance** (How many empty cylinders they are holding).
  - [ ] **Add Buyer Button/Modal:** Inputs to create a new buyer (Shop Name, Owner Name, Mobile Number, Address, **Opening Financial Balance**, and **Opening Cylinder Balance**). *(Crucial for onboarding existing clients so they can log what buyers already owe them before using the software).*
  - [ ] **Buyer Ledger (Detail View):** Clicking on a buyer opens their dedicated profile.
    - View all specific bills, tracking exactly how many full they took vs empties they returned.
    - Auto-calculates both their *Financial Outstanding Balance* and *Cylinder Holding Balance*.

## 6. Settings (Users & Reports)
- **Status:** Planning (Active)
- **Purpose:** To mirror the structural design of the `Duro_POS` settings tab, managing users (similar to Duro_POS branches), generating reports, and handling agency-wide policies.
- **Flow & Options:**
  - [ ] **Top Header & Logout:** A clean header with a prominent "Logout" button on the top right.
  - [ ] **User / Driver Management (Replaces "Branch Access"):**
    - Quota indicator (e.g., "Driver quota: 3/5 used").
    - Big primary button: `+ Create New Delivery Driver`.
    - A scrollable list/grid of all created users (drivers) showing their status.
    - Toggle switch on each user to instantly activate/deactivate their login access.
  - [ ] **Generate Reports Button:** A dedicated, full-width button to open the Reports view (Sales & Collection summaries).

---
*Note: We will continuously update this document as we build out the options and finalize the code for each screen.*
