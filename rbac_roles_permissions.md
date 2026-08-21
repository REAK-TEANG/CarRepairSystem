# Car Repair System — Role-Based Access Control (RBAC) Specification

> **Document Purpose:** Single source of truth for all user roles, permissions, feature access rules, and access control matrices for the Car Repair Shop Management System. This document translates requirements from [`system_requirements.md`](file:///d:/CarRepairSystem/system_requirements.md) into concrete security scopes for both Frontend UI and Backend API enforcement.

---

## 1. System Roles Overview

The system defines **6 distinct roles** based on organizational responsibilities within a car repair workshop:

| Role ID | Role Name | Code Name | Primary Responsibility |
|:---:|:---|:---|:---|
| **1** | **System Administrator** | `admin` | Full system access, system configuration, database backup/restore, user management |
| **2** | **Workshop Manager** | `manager` | Operational oversight, employee schedules, performance tracking, financial reports |
| **3** | **Service Advisor** | `service_advisor` | Front-desk operations: customer intake, appointment booking, vehicle registration, repair order creation, invoice generation |
| **4** | **Mechanic / Technician** | `mechanic` | Execution of repair orders: view assigned jobs, update repair status, record parts used/services performed |
| **5** | **Cashier** | `cashier` | Financial transactions: payment collection, invoice status updates, refund processing, daily cash reconciliation |
| **6** | **Storekeeper / Inventory Manager** | `storekeeper` | Inventory control: spare parts management, stock adjustments, supplier purchase orders, low-stock alerts |

---

## 2. Global Role-Permissions Matrix

Legend:
- `C` = Create / Add
- `R` = Read / View
- `U` = Update / Edit
- `D` = Delete
- `-` = No Access

| System Module / Feature | Admin | Manager | Service Advisor | Mechanic | Cashier | Storekeeper |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Authentication & Profile** | C, R, U, D | R, U | R, U | R, U | R, U | R, U |
| **2. Dashboard & Analytics** | Full | Operations | Front-Desk | Mechanic WS | Financial | Inventory WS |
| **3. Customer Management** | C, R, U, D | C, R, U | C, R, U, D | R | R | - |
| **4. Vehicle Management** | C, R, U, D | C, R, U | C, R, U, D | R | R | - |
| **5. Appointment Management** | C, R, U, D | C, R, U, D | C, R, U, D | R | R | - |
| **6. Repair Job Management** | C, R, U, D | C, R, U, D | C, R, U | R, U (Assigned) | R | R (Parts Check) |
| **7. Service Catalog** | C, R, U, D | C, R, U | R | R | R | - |
| **8. Mechanic Management** | C, R, U, D | C, R, U | R | R (Self) | - | - |
| **9. Spare Parts Inventory** | C, R, U, D | C, R, U | R | R | - | C, R, U, D |
| **10. Supplier Management** | C, R, U, D | C, R, U | - | - | - | C, R, U, D |
| **11. Invoicing & Payments** | C, R, U, D | C, R, U, D | C, R (Generate) | - | C, R, U (Pay/Refund) | - |
| **12. Employee & Attendance** | C, R, U, D | C, R, U, D | R (Self) | R (Self) | R (Self) | R (Self) |
| **13. Maintenance History** | C, R, U, D | C, R, U | C, R, U | R | R | - |
| **14. Reports & Analytics** | Full | Operations/Sales | Customer/Jobs | Self Stats | Financial | Inventory |
| **15. Notification System** | System Alerts | All Alerts | Customer Alerts | Job Alerts | Payment Alerts | Stock Alerts |
| **16. System Settings** | C, R, U, D | R | - | - | - | - |

---

## 3. Detailed Role Capabilities & Workflows

### 3.1 System Administrator (`admin`)
- **Scope:** Unrestricted system access across all 16 modules.
- **Key Capabilities:**
  - Create, modify, or deactivate user accounts and assign roles.
  - Configure global workshop parameters (tax rates, currency, business hours, workshop info).
  - Perform database backups, restores, and audit log reviews.
  - Full CRUD on all data entities (Customers, Vehicles, Repair Orders, Inventory, Financials).

### 3.2 Workshop Manager (`manager`)
- **Scope:** Operational management, employee oversight, and analytics.
- **Key Capabilities:**
  - View executive dashboards (revenue charts, job turnaround times, technician productivity).
  - Manage employee profiles, work schedules, and attendance records.
  - Approve high-value estimates, discounts, or refunds.
  - Access all operational reports (P&L, Daily Sales, Mechanic Performance, Stock Valuation).
  - Cannot modify system settings or manage user access permissions.

### 3.3 Service Advisor (`service_advisor`)
- **Scope:** Customer intake, scheduling, service advisory, and repair job initiation.
- **Key Capabilities:**
  - Register new customers and link vehicle profiles.
  - Book, reschedule, or cancel customer service appointments.
  - Create Repair Orders based on customer complaint and initial diagnosis.
  - Select services from Service Catalog and assign primary mechanic.
  - Generate initial estimates and final invoices for customers.
  - Track vehicle repair progress and notify customers when ready for pickup.

### 3.4 Mechanic / Technician (`mechanic`)
- **Scope:** Assigned job execution, status reporting, and diagnostic logging.
- **Key Capabilities:**
  - Access dedicated **Mechanic Workspace** (`/mechanic/dashboard`).
  - View list of assigned vehicles and repair job specifications.
  - Update job status (`Diagnosing` → `Repairing` → `Waiting for Parts` → `Ready for Pickup`).
  - Log diagnostic notes, add services performed, and request required spare parts from inventory.
  - View personal performance metrics (completed jobs, average repair duration, customer rating).
  - Restricted from accessing customer billing data, supplier costs, or employee salaries.

### 3.5 Cashier (`cashier`)
- **Scope:** Billing, payment processing, invoicing, and cash handling.
- **Key Capabilities:**
  - View pending and issued customer invoices.
  - Record customer payments via Cash, Credit/Debit Card, Bank Transfer, QR Payment, or Mobile Payment.
  - Issue payment receipts and print formal invoices.
  - Process customer refund requests (with manager/admin approval requirement).
  - View daily sales summary and cash drawer reconciliation report.

### 3.6 Storekeeper / Inventory Manager (`storekeeper`)
- **Scope:** Stock control, warehouse management, and supplier procurement.
- **Key Capabilities:**
  - Full CRUD on Spare Parts catalog (part codes, unit prices, minimum stock thresholds, storage location).
  - Execute inventory transactions: **Stock In**, **Stock Out**, and **Inventory Adjustments**.
  - Receive parts requests from repair orders and issue stock to mechanics.
  - Manage Supplier profiles and issue Purchase Orders (`Draft` → `Ordered` → `Received`).
  - Receive stock alert notifications when parts drop below low-stock threshold.

---

## 4. Frontend Route Access Control (React Router)

| Route Path | Page Component | Allowed Roles | Description |
|:---|:---|:---|:---|
| `/login` | `LoginPage` | Public | Authentication endpoint |
| `/unauthorized` | `UnauthorizedPage` | Public | 403 Forbidden fallback screen |
| `/admin/dashboard` | `AdminDashboard` | `admin`, `manager` | High-level metrics, revenue, repair status charts |
| `/mechanic/dashboard` | `MechanicDashboard` | `mechanic` | Mechanic personal workspace & assigned job queue |
| `/customers` | `CustomersPage` | `admin`, `manager`, `service_advisor`, `cashier` | Customer registry and history |
| `/vehicles` | `VehiclesPage` | `admin`, `manager`, `service_advisor`, `mechanic` | Vehicle registry and service records |
| `/appointments` | `AppointmentsPage` | `admin`, `manager`, `service_advisor` | Appointment booking calendar & queue |
| `/repair-jobs` | `RepairJobsPage` | `admin`, `manager`, `service_advisor`, `mechanic` | Active repair order management |
| `/services` | `ServicesPage` | `admin`, `manager`, `service_advisor` | Service catalog & pricing configuration |
| `/mechanics` | `MechanicsPage` | `admin`, `manager`, `service_advisor` | Mechanic roster, assignment, schedules |
| `/inventory` | `InventoryPage` | `admin`, `manager`, `storekeeper`, `mechanic` | Spare parts stock & adjustments |
| `/suppliers` | `SuppliersPage` | `admin`, `manager`, `storekeeper` | Supplier profiles & purchase orders |
| `/invoices` | `InvoicesPage` | `admin`, `manager`, `service_advisor`, `cashier` | Customer billing, receipts & payments |
| `/employees` | `EmployeesPage` | `admin`, `manager` | HR, attendance, schedules & payroll |
| `/reports` | `ReportsPage` | `admin`, `manager` | Business analytics & PDF/Excel exports |
| `/settings` | `SettingsPage` | `admin` | Workshop configuration & DB backup |

---

## 5. Security & Implementation Rules

### 5.1 Frontend Control Layer
1. **Route Protection (`ProtectedRoute`):** Every protected route must evaluate `user.role` against `allowedRoles`. Unauthorized access triggers automatic client-side redirect to `/unauthorized`.
2. **Dynamic UI Element Pruning:** Buttons (e.g., "Delete Customer", "Add Service", "Process Refund") must check `user.role` before rendering.
3. **Sidebar Filtering:** Navigation links are filtered at render time using `filteredNav = navLinks.filter(item => item.roles.includes(user.role))`.

### 5.2 Backend Control Layer (Laravel Sanctum & Middleware)
1. **API Route Guards:** Every API endpoint must be protected by `auth:sanctum` middleware and a custom `role:<roles>` policy middleware.
2. **Data Scoping:** 
   - Mechanics fetching `/api/repair-orders` receive **only** orders assigned to their `employee_id` unless requested by `admin`/`manager`/`service_advisor`.
   - Cashiers fetching `/api/invoices` receive financial summaries, but cannot view technical mechanic notes.
3. **Database Constraints:** Role references (`role_id`) enforce foreign key integrity against the `roles` master table (`schema_supabase.sql`).

---

*Document Version: 1.0 — Approved for Implementation*
