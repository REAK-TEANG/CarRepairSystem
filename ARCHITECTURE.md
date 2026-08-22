# Car Repair System — System Architecture

> **Document Purpose:** Single source of truth for the technical architecture, domain modeling, state management conventions, and directory organization of the Car Repair Shop Management System. This document provides developers and AI assistants with the architectural blueprint for extending, refactoring, and maintaining the codebase.

---

## 1. High-Level System Topology

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT APPLICATION (Browser)                         │
│                                                                                  │
│   React 19 + Vite 8 │ Tailwind CSS │ TanStack React Query 5 │ React Router DOM 7  │
│                                                                                  │
│   ┌──────────────────┐  ┌───────────────────┐  ┌─────────────────────────────┐   │
│   │   AuthContext    │  │   ThemeContext    │  │        ToastContext         │   │
│   │ (6-Role RBAC)    │  │ (Dark/Light/Dim)  │  │ (Micro-Toast Notifications) │   │
│   └─────────┬────────┘  └─────────┬─────────┘  └──────────────┬──────────────┘   │
│             │                     │                           │                  │
│             ▼                     ▼                           ▼                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │              Domain Pages & Views (Organized by Sub-System)              │   │
│   │    /dashboards      /operations        /workshop        /management      │   │
│   └───────────────────────────────────┬──────────────────────────────────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │            Optimistic TanStack Query Hooks Layer (`src/hooks/`)          │   │
│   │      Instant UI Mutations · Automatic Error Rollback · Multi-View Sync   │   │
│   └───────────────────────────────────┬──────────────────────────────────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │               Service & HTTP Client Layer (`src/services/`)              │   │
│   │     Dynamic API Switch (`USE_REAL_API`) · Mock Fallback · RESTful Endpoints   │
│   └───────────────────────────────────┬──────────────────────────────────────┘   │
└───────────────────────────────────────┼──────────────────────────────────────────┘
                                        │ RESTful JSON over HTTP / HTTPS
                                        │ + Real-Time WebSocket (Pusher / Echo)
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               BACKEND API SERVER                                 │
│                                                                                  │
│   Laravel (PHP) │ Laravel Sanctum (SPA Auth) │ Laravel Reverb (WebSockets)       │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                      Eloquent ORM & Migrations                           │   │
│   └───────────────────────────────────┬──────────────────────────────────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│                          ┌─────────────────────────┐                             │
│                          │  PostgreSQL / Supabase  │                             │
│                          └─────────────────────────┘                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

### Frontend (Client Application)

| Concern | Technology | Version | Purpose |
|---|---|---|---|
| **Core Framework** | React | 19.x | Component lifecycle, UI rendering |
| **Build & Tooling** | Vite | 8.x | Lightning-fast HMR and production bundle optimization |
| **Styling & Design Tokens** | Tailwind CSS | 3.4 | Modern utility design with custom theme CSS variables |
| **Iconography** | Phosphor Icons | `@phosphor-icons/react` | Unified, weight-adjustable icon system |
| **Client Routing** | React Router DOM | 7.x | Declarative, role-guarded SPA routing |
| **Server State & Cache** | TanStack React Query | 5.x | Optimistic caching, background revalidation, mutations |
| **Notifications** | Custom Context | React Context | Non-intrusive micro-toasts for real-time CRUD feedback |
| **Class Composition** | `clsx` | Latest | Conditional and dynamic class merging |

### Backend (Server API — Scaffolded & Planned)

| Concern | Technology | Purpose |
|---|---|---|
| **API Framework** | Laravel (PHP) | RESTful API endpoints and business logic validation |
| **Authentication** | Laravel Sanctum | Token-based SPA session authentication |
| **Database ORM** | Eloquent ORM | Relational schema management, transactions, hooks |
| **Relational Database** | PostgreSQL / Supabase | Primary database targeting [`schema_supabase.sql`](file:///d:/CarRepairSystem/database/schema_supabase.sql) |
| **Real-time Engine** | Laravel Reverb / Pusher | Event broadcasting to invalidate frontend cache queries |

---

## 3. Frontend Architecture & Directory Layout

The frontend codebase in `CarRepairShop/src/` follows a **Domain-Driven, Modular File Architecture** designed for maintainability and scalability.

```
CarRepairShop/
├── public/                       # Public static assets & favicon
├── src/
│   ├── assets/                   # Static media (hero images, SVGs)
│   ├── components/               # Modular, reusable presentation components
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx# RBAC route guard based on active user role
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx       # Multi-role filtered navigation drawer
│   │   │   └── TopBar.jsx        # Breadcrumb telemetry, search, profile, role switcher
│   │   └── ui/
│   │       ├── Logo.jsx          # Geometric line-style SVG vector logo
│   │       ├── Modal.jsx         # Accessible, animated modal dialog component
│   │       ├── StatCard.jsx      # Reusable dashboard metric card with trends
│   │       └── StatusBadge.jsx   # Contextual color-coded status badge
│   ├── context/                  # Global application state providers
│   │   ├── AuthContext.jsx       # 6-role RBAC state, session switching, permission checks
│   │   ├── ThemeContext.jsx      # Theme engine (Dark, Light, Slate) with CSS variables
│   │   └── ToastContext.jsx      # Micro-toast notification system for CRUD operations
│   ├── hooks/                    # TanStack React Query Optimistic Hooks
│   │   ├── index.js              # Clean barrel export for all query/mutation hooks
│   │   ├── useAppointments.js    # Create/Update/Cancel optimistic mutations
│   │   ├── useCustomers.js       # Create/Update/Delete customer mutations
│   │   ├── useEmployees.js       # Create/Update/Toggle attendance mutations
│   │   ├── useInventory.js       # Create/Update/Stock In/Stock Out mutations
│   │   ├── useInvoices.js        # Create/Record payment mutations
│   │   ├── useMechanics.js       # Create/Update/Delete mechanic mutations
│   │   ├── useRepairJobs.js      # Create/Update work order status mutations
│   │   ├── useServicesCatalog.js # Create/Update/Toggle active service mutations
│   │   ├── useSuppliers.js       # Create/Update/Delete supplier mutations
│   │   └── useVehicles.js        # Create/Update/Delete vehicle mutations
│   ├── layouts/
│   │   └── AppLayout.jsx         # Shell layout: Sidebar + TopBar + Scrollable <Outlet />
│   ├── pages/                    # Domain-Driven Page Modules
│   │   ├── index.js              # Central barrel export for all domain views
│   │   ├── auth/                 # Authentication & Security Views
│   │   │   ├── LoginPage.jsx
│   │   │   └── UnauthorizedPage.jsx
│   │   ├── dashboards/           # Role-Specific Workspaces
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── MechanicDashboard.jsx
│   │   ├── operations/           # Front-Desk & Operational Workflows
│   │   │   ├── AppointmentsPage.jsx
│   │   │   ├── CustomersPage.jsx
│   │   │   ├── RepairJobsPage.jsx
│   │   │   └── VehiclesPage.jsx
│   │   ├── workshop/             # Shop Floor, Parts & Vendors
│   │   │   ├── InventoryPage.jsx
│   │   │   ├── MechanicsPage.jsx
│   │   │   ├── ServicesPage.jsx
│   │   │   └── SuppliersPage.jsx
│   │   └── management/           # Financials, HR & Configuration
│   │       ├── EmployeesPage.jsx
│   │       ├── InvoicesPage.jsx
│   │       ├── ReportsPage.jsx
│   │       └── SettingsPage.jsx
│   ├── services/                 # Decoupled API Client & Data Access Layer
│   │   ├── index.js              # Central service barrel export
│   │   ├── apiClient.js          # RESTful client with `USE_REAL_API` toggle switch
│   │   ├── appointmentService.js
│   │   ├── customerService.js
│   │   ├── employeeService.js
│   │   ├── inventoryService.js
│   │   ├── invoiceService.js
│   │   ├── mechanicService.js
│   │   ├── repairJobService.js
│   │   ├── reportService.js
│   │   ├── serviceCatalogService.js
│   │   ├── settingsService.js
│   │   └── supplierService.js
│   ├── App.jsx                   # React Router route definitions & global provider tree
│   ├── main.jsx                  # React 19 application mount point
│   └── index.css                 # Tailwind directives, CSS variable themes & keyframes
├── tailwind.config.js            # Tailwind custom extensions & color schemes
├── vite.config.js                # Vite build and react plugin configurations
└── package.json                  # Dependencies and build scripts
```

---

## 4. Role-Based Access Control (RBAC) Architecture

The system enforces access control according to [`rbac_roles_permissions.md`](file:///d:/CarRepairSystem/rbac_roles_permissions.md) across **6 distinct roles**:

### 4.1 System Roles Summary

| Role ID | Role Code | Role Name | Primary Domain | Default Home Route |
|:---:|:---|:---|:---|:---|
| **1** | `admin` | System Administrator | Unrestricted configuration, all 16 modules | `/admin/dashboard` |
| **2** | `manager` | Workshop Manager | Operations, HR, revenue analytics, reports | `/admin/dashboard` |
| **3** | `service_advisor` | Service Advisor | Intake, appointments, repair orders, invoices | `/appointments` |
| **4** | `mechanic` | Technician | Bay work queue, repair status, diagnostic notes | `/mechanic/dashboard` |
| **5** | `cashier` | Cashier | Invoicing, payment collection, cash receipts | `/invoices` |
| **6** | `storekeeper` | Inventory Manager | Spare parts, stock-in/out, supplier orders | `/inventory` |

### 4.2 Three-Tier RBAC Enforcement

1. **Client Route Guard ([`ProtectedRoute.jsx`](file:///D:/carrepairsystem/CarRepairShop/src/components/auth/ProtectedRoute.jsx))**:
   - Compares the active `user.role` against `allowedRoles`.
   - Unauthorized attempts immediately redirect to `/unauthorized` (403 view).
2. **Context-Aware Action Scoping (`can(module, action)` in [`AuthContext.jsx`](file:///D:/carrepairsystem/CarRepairShop/src/context/AuthContext.jsx))**:
   - Controls CRUD buttons (Add, Edit, Delete, Stock In, Receive Payment).
   - Read-only users cannot see or trigger mutating UI actions.
3. **Dynamic Navigation Filtering ([`Sidebar.jsx`](file:///D:/carrepairsystem/CarRepairShop/src/components/layout/Sidebar.jsx))**:
   - Sidebar links are filtered at runtime so users only view modules permitted for their role.

---

## 5. State Management & Optimistic UI Strategy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      OPTIMISTIC MUTATION LIFECYCLE                       │
│                                                                          │
│  1. User triggers action (e.g., "Add Customer", "Stock In (+10)")        │
│                                                                          │
│  2. `onMutate` Lifecycle:                                                │
│     ├── Cancel ongoing queries: `queryClient.cancelQueries({ queryKey })`│
│     ├── Snapshot previous state: `queryClient.getQueryData(queryKey)`     │
│     ├── Immediately append/update local cache: `setQueryData(...)`       │
│     └── UI updates instantly in < 1ms (Zero UI lag, no spinner traps)    │
│                                                                          │
│  3. Micro-Toast fires confirmation badge via `ToastContext`               │
│                                                                          │
│  4. Network Request executes in background via Service Layer:             │
│     ├── ON SUCCESS (`onSettled`): Invalidate cache & sync server IDs     │
│     └── ON ERROR (`onError`): Roll back cache to snapshot & show alert   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API Integration & Real Data Room

All data operations are decoupled through the service layer in `CarRepairShop/src/services/`.

- **Mock to Real API Switch**:
  - Located in [**`apiClient.js`**](file:///D:/carrepairsystem/CarRepairShop/src/services/apiClient.js#L9):
    ```javascript
    export const API_CONFIG = {
      BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      USE_REAL_API: false, // Set to true when backend Laravel API is running
    }
    ```
- **Seamless Database Synchronization**:
  - When `USE_REAL_API: true` is toggled, all query and mutation hooks send standard RESTful HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) to the backend with Sanctum authorization headers while keeping all optimistic UI benefits intact.

---

## 7. Database Entity Mapping

The database schema is defined in [`database/schema_supabase.sql`](file:///d:/CarRepairSystem/database/schema_supabase.sql) and maps 1-to-1 with the frontend services:

| System Domain | Database Tables | Frontend Service & Hook |
|---|---|---|
| **Authentication & RBAC** | `roles`, `users`, `user_sessions` | `AuthContext.jsx` |
| **Staff & HR** | `employees`, `employee_attendance`, `employee_schedules` | `employeeService.js` / `useEmployees.js` |
| **Customer Registry** | `customers` | `customerService.js` / `useCustomers.js` |
| **Vehicle Registry** | `vehicles` | `vehicleService.js` / `useVehicles.js` |
| **Appointment Booking** | `appointments` | `appointmentService.js` / `useAppointments.js` |
| **Repair Work Orders** | `repair_orders`, `repair_services`, `repair_parts` | `repairJobService.js` / `useRepairJobs.js` |
| **Service Catalog** | `services` | `serviceCatalogService.js` / `useServicesCatalog.js` |
| **Mechanics Roster** | `employees` (role = mechanic) | `mechanicService.js` / `useMechanics.js` |
| **Spare Parts & Inventory** | `spare_parts`, `inventory_transactions` | `inventoryService.js` / `useInventory.js` |
| **Suppliers & Vendors** | `suppliers`, `purchase_orders`, `purchase_order_items` | `supplierService.js` / `useSuppliers.js` |
| **Billing & Payments** | `invoices`, `payments`, `refunds` | `invoiceService.js` / `useInvoices.js` |
| **Workshop Settings** | `settings` | `settingsService.js` |

---

## 8. Development & Verification Commands

To run and verify the organized system:

```bash
# Navigate to frontend project
cd D:\carrepairsystem\CarRepairShop

# Start local development server
npm run dev

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```

---

*Last updated: August 22, 2026 — Architecture & Domain-Driven File Organization Refactor.*
