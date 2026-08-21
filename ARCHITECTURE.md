# Car Repair System — System Architecture

> **Document Purpose:** Single source of truth for the technical architecture, conventions, and project structure of the Car Repair Shop Management System. This document is intended to be read by developers (or AI assistants) before writing any code.

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│                                                                     │
│  React 19 + Vite 8 │ Tailwind CSS │ React Query │ React Router 7   │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐    │
│  │  AuthContext │  │  AppLayout  │  │   Role-Based Routing     │    │
│  │  (RBAC)     │  │  (Shell)    │  │   /admin/* /mechanic/*   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────────────────────────┘    │
│         │                │                                          │
│         ▼                ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │            React Query (Data Fetching & Cache)              │    │
│  └────────────────────────┬────────────────────────────────────┘    │
│                           │ RESTful HTTP (JSON)                     │
│                           │ + WebSocket (Laravel Echo)              │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (API)                                │
│                                                                     │
│  Laravel (PHP)  │  Sanctum (Auth)  │  Reverb/Pusher (WebSocket)    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │               Eloquent ORM + Migrations                  │       │
│  └────────────────────────┬─────────────────────────────────┘       │
│                           │                                         │
│                           ▼                                         │
│                     ┌───────────┐                                   │
│                     │PostgreSQL │                                   │
│                     └───────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

### Frontend (Client)

| Concern             | Technology                                           |
|----------------------|------------------------------------------------------|
| **Framework**        | React 19 (via Vite 8)                                |
| **Language**         | JavaScript (ES Modules)                              |
| **Styling**          | Tailwind CSS 3.4                                     |
| **Icons**            | Phosphor Icons (`@phosphor-icons/react`)             |
| **Routing**          | React Router DOM 7                                   |
| **Server State**     | TanStack React Query 5                               |
| **Real-time**        | Laravel Echo (WebSocket client)                      |
| **Utility**          | clsx (conditional class merging)                     |

### Backend (Server)

| Concern              | Technology                                           |
|----------------------|------------------------------------------------------|
| **Framework**        | Laravel (PHP)                                        |
| **Authentication**   | Laravel Sanctum (SPA token-based auth)               |
| **ORM**              | Eloquent (migrations managed via Laravel)            |
| **Database**         | PostgreSQL                                           |
| **Real-time**        | Laravel Reverb or Pusher (event broadcasting)        |

---

## 3. Frontend Architecture

### 3.1 Folder Structure

```
CarRepairShop/
├── public/
├── src/
│   ├── assets/                   # Static assets (images, fonts)
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx    # Route guard — checks user.role
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx           # Role-filtered navigation
│   │   │   └── TopBar.jsx            # Breadcrumbs, search, profile, role switcher
│   │   └── ui/
│   │       ├── StatCard.jsx          # Reusable metric card
│   │       └── StatusBadge.jsx       # Color-coded status pill
│   ├── context/
│   │   └── AuthContext.jsx           # Global auth state (user, role, toggleRole)
│   ├── layouts/
│   │   └── AppLayout.jsx            # Shell: Sidebar + TopBar + <Outlet />
│   ├── pages/
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx   # Full metrics, charts, recent activity
│   │   ├── mechanic/
│   │   │   └── MechanicDashboard.jsx # Assigned jobs, personal metrics
│   │   ├── CustomersPage.jsx        # CRUD table (Admin only)
│   │   ├── VehiclesPage.jsx         # CRUD table (Admin only)
│   │   ├── RepairJobsPage.jsx       # Shared: Admin + Mechanic
│   │   ├── LoginPage.jsx            # Public: email/password form
│   │   └── UnauthorizedPage.jsx     # 403 Access Denied
│   ├── App.jsx                      # Route definitions + providers
│   ├── main.jsx                     # ReactDOM entry point
│   └── index.css                    # Tailwind directives + custom styles
├── tailwind.config.js               # Custom colors, fonts, shadows
├── vite.config.js                   # Vite + React plugin + resolve.dedupe
├── postcss.config.js
└── package.json
```

### 3.2 Role-Based Access Control (RBAC)

The frontend implements RBAC through three layers:

#### Layer 1 — `AuthContext`
Provides `user` (name, role) and `toggleRole()` globally via React Context. Currently uses mock data; will be replaced by a real auth API in production.

#### Layer 2 — `ProtectedRoute`
A React Router layout route that checks `user.role` against an `allowedRoles` array. Unauthorized access redirects to `/unauthorized`.

#### Layer 3 — `Sidebar` link filtering
Each navigation item carries a `roles` array. The Sidebar filters links at render time so users only see what they are permitted to access.

#### Route Map

| Path                  | Component              | Allowed Roles         |
|-----------------------|------------------------|-----------------------|
| `/login`              | LoginPage              | Public                |
| `/unauthorized`       | UnauthorizedPage       | Public                |
| `/admin/dashboard`    | AdminDashboard         | `admin`               |
| `/customers`          | CustomersPage          | `admin`               |
| `/vehicles`           | VehiclesPage           | `admin`               |
| `/mechanic/dashboard` | MechanicDashboard      | `mechanic`            |
| `/repair-jobs`        | RepairJobsPage         | `admin`, `mechanic`   |

The `RoleBasedHome` helper in `App.jsx` redirects `/` to the correct dashboard based on `user.role`.

### 3.3 Layout Architecture

```
┌──────────────────────────────────────────────────────┐
│  AppLayout (flex row, h-screen)                      │
│                                                      │
│  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │          │  │  TopBar (h-20, sticky)            │  │
│  │ Sidebar  │  ├──────────────────────────────────┤  │
│  │ (w-64    │  │                                  │  │
│  │  or 76px │  │  <main> — scrollable content     │  │
│  │  when    │  │    <Outlet /> renders the page   │  │
│  │  collapsed│ │                                  │  │
│  │          │  │                                  │  │
│  └──────────┘  └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 4. Database Architecture

The schema is defined in [`schema_supabase.sql`](file:///d:/CarRepairSystem/database/schema_supabase.sql) and targets **PostgreSQL**.

### 4.1 Core Entities

| Entity                 | Table(s)                              | Purpose                                      |
|------------------------|---------------------------------------|----------------------------------------------|
| **Users & Auth**       | `roles`, `users`, `user_sessions`     | Authentication, RBAC, session tokens         |
| **Employees**          | `employees`, `employee_attendance`, `employee_schedules` | HR data, clock-in/out, weekly schedules |
| **Customers**          | `customers`                           | Customer registry with contact info          |
| **Vehicles**           | `vehicles`                            | Vehicles linked to customers                 |
| **Appointments**       | `appointments`                        | Scheduled service bookings                   |
| **Repair Orders**      | `repair_orders`, `repair_services`, `repair_parts` | Job tracking, services performed, parts used |
| **Services Catalog**   | `services`                            | Predefined service types with pricing        |
| **Inventory**          | `spare_parts`, `inventory_transactions` | Stock levels, movement history             |
| **Suppliers**          | `suppliers`, `purchase_orders`, `purchase_order_items` | Vendor management, procurement           |
| **Invoicing**          | `invoices`, `payments`, `refunds`     | Billing, payment recording, refund tracking  |
| **Maintenance**        | `maintenance_history`                 | Vehicle service log, next-service reminders  |
| **Notifications**      | `notifications`                       | In-app alerts (appointments, low stock, etc) |
| **Settings**           | `settings`                            | Key-value config (workshop info, tax, hours) |

### 4.2 Default Roles (Seed Data)

| Role             | Description                                     |
|------------------|-------------------------------------------------|
| Admin            | Full system access and configuration            |
| Manager          | Manage operations, employees, and reports       |
| Service Advisor  | Handle customers, appointments, repair orders   |
| Mechanic         | View and update assigned repair jobs            |
| Cashier          | Manage invoices and payments                    |
| Storekeeper      | Manage spare parts inventory and suppliers      |

### 4.3 Key Design Patterns

- **Auto-updated timestamps:** All tables with `updated_at` columns use a shared `update_updated_at_column()` trigger.
- **Soft references:** Polymorphic `reference_id` + `reference_type` columns on `inventory_transactions` and `notifications` for flexible linking.
- **Cascading deletes:** Child records (attendance, repair parts, etc.) cascade when their parent is deleted.
- **Indexed lookups:** Frequently searched columns (`customer_code`, `vehicle_number`, `order_number`, etc.) are indexed.

---

## 5. Data Flow

### Standard Request Cycle

```
User Action → React Component → React Query (mutation/query)
  → HTTP Request (fetch/axios) → Laravel API Route
    → Controller → Service/Model → Eloquent → PostgreSQL
      → JSON Response → React Query Cache → UI Re-render
```

### Real-Time Event Cycle

```
Laravel fires Event → Broadcasting (Reverb/Pusher) → WebSocket
  → Laravel Echo (client) → React Query cache invalidation → UI update
```

**Example:** When a mechanic updates a repair job to "Completed," Laravel fires a `RepairJobCompleted` event. The admin dashboard receives it via Echo and React Query automatically refreshes the job list.

---

## 6. Design & UI/UX

Detailed design tokens, color palette, and typography rules are maintained in [`ui_ux_guidelines.md`](file:///d:/CarRepairSystem/ui_ux_guidelines.md).

**Quick Reference:**

| Token                | Value       | Usage                                |
|----------------------|-------------|--------------------------------------|
| Canvas Background    | `#101214`   | App background                       |
| Card Surface         | `#282F35`   | Sidebar, cards, header, table rows   |
| Primary Accent       | `#B5FF57`   | Active nav, CTAs, primary highlights |
| Secondary Accent     | `#13F287`   | Status badges, positive trends       |
| Primary Text         | `#F8FAFC`   | Headings, metric values              |
| Secondary Text       | `#A0AEC0`   | Captions, labels, muted copy         |
| Font Family          | SF UI Display / Inter (fallback) |                       |
| Icon Library         | Phosphor Icons (all weights)     |                       |

---

## 7. Project Phasing

> Cross-referenced with [`system_requirements.md`](file:///d:/CarRepairSystem/system_requirements.md) (Req 1–16).

### Phase 1 — MVP (Current)
The minimum set of features required for a functioning repair shop workflow:
**Customer → Appointment → Service Selection → Mechanic Assignment → Repair Job → Completion**

#### Frontend Pages (React)
- [x] User Authentication & RBAC (frontend mock — Admin, Mechanic) *(Req 1)*
- [x] Admin Dashboard — metrics, charts, activity feed *(Req 2)*
- [x] Mechanic Dashboard — assigned jobs, personal stats *(Req 2)*
- [x] Customer Management — CRUD table, search *(Req 3)*
- [x] Vehicle Management — CRUD table, search *(Req 4)*
- [x] Repair Job Management — CRUD table, status updates, shared Admin + Mechanic *(Req 6)*
- [x] **Appointment Management** — booking form, calendar view, assign mechanic *(Req 5)*
- [x] **Service Catalog Management** — CRUD for service types & pricing *(Req 7)*
- [x] **Mechanic Management** — mechanic list, specialization, job assignment, schedule view *(Req 8)*

#### Backend API (Laravel — not yet started)
- [ ] Laravel project scaffolding & Sanctum auth setup *(Req 1)*
- [ ] Database migrations from `schema_supabase.sql` *(all Reqs)*
- [ ] RESTful API endpoints for: Customers, Vehicles, Appointments, Repair Jobs, Services, Mechanics
- [ ] Real authentication (Sanctum) replacing mock AuthContext
- [ ] Role-Based middleware (Admin, Mechanic, Service Advisor, Cashier)

### Phase 2 — Operations & Inventory *(Req 9–12)*
- [ ] Spare Parts Inventory & Stock Adjustments *(Req 9)*
- [ ] Supplier Management & Purchase Orders *(Req 10)*
- [ ] Invoicing, Payments, & Refunds *(Req 11)*
- [ ] Employee Management, Schedules & Attendance *(Req 12)*

### Phase 3 — Advanced Features *(Req 13–16)*
- [ ] Maintenance History & Next-Service Tracking *(Req 13)*
- [ ] Reporting — PDF/Excel exports (revenue, mechanic performance, inventory) *(Req 14)*
- [ ] Automated Notification System (email/SMS reminders) *(Req 15)*
- [ ] System Settings (workshop info, tax, currency, business hours) *(Req 16)*
- [ ] Real-time updates via Laravel Reverb/Pusher + Laravel Echo

---

## 8. Conventions & Rules

### File Naming
- **Pages:** PascalCase (`AdminDashboard.jsx`, `CustomersPage.jsx`)
- **Components:** PascalCase (`StatCard.jsx`, `ProtectedRoute.jsx`)
- **Contexts:** PascalCase (`AuthContext.jsx`)
- **Config files:** lowercase (`tailwind.config.js`, `vite.config.js`)

### Code Style
- Functional components with hooks (no class components)
- Named exports for contexts/hooks; default exports for pages and components
- Tailwind utility classes directly on JSX elements (no separate CSS modules)
- `clsx` for conditional class composition
- All icons sourced from `@phosphor-icons/react` — no other icon library

### Routing Convention
- Role-prefixed paths for dashboards: `/admin/*`, `/mechanic/*`
- Shared feature paths at root level: `/customers`, `/repair-jobs`
- Public paths: `/login`, `/unauthorized`

### Git
- Feature branches off `main`
- Commit messages: `type(scope): description` (e.g., `feat(rbac): add ProtectedRoute component`)

---

## 9. Related Documents

| Document | Path | Purpose |
|----------|------|---------|
| RBAC Specification | [`rbac_roles_permissions.md`](file:///d:/CarRepairSystem/rbac_roles_permissions.md) | Roles, permissions matrix, module access rules |
| UI/UX Guidelines | [`ui_ux_guidelines.md`](file:///d:/CarRepairSystem/ui_ux_guidelines.md) | Colors, typography, layout rules |
| System Requirements | [`system_requirements.md`](file:///d:/CarRepairSystem/system_requirements.md) | Full feature specification |
| Database Schema | [`schema_supabase.sql`](file:///d:/CarRepairSystem/database/schema_supabase.sql) | PostgreSQL DDL + seed data |

---

*Last updated: August 18, 2026 — Phase 1 (Frontend MVP with RBAC)*
