# Auto Repair Shop - Database Documentation

> **Database Engine:** PostgreSQL (Supabase)  
> **Schema File:** [schema_supabase.sql](file:///d:/CarRepairSystem/database/schema_supabase.sql)  
> **Total Tables:** 20  
> **Total ENUM Types:** 12  

---

## Table of Contents

1. [Entity Relationship Overview](#1-entity-relationship-overview)
2. [Custom ENUM Types](#2-custom-enum-types)
3. [Table Documentation](#3-table-documentation)
   - [roles](#31-roles)
   - [users](#32-users)
   - [user_sessions](#33-user_sessions)
   - [employees](#34-employees)
   - [employee_attendance](#35-employee_attendance)
   - [employee_schedules](#36-employee_schedules)
   - [customers](#37-customers)
   - [vehicles](#38-vehicles)
   - [services](#39-services)
   - [appointments](#310-appointments)
   - [repair_orders](#311-repair_orders)
   - [repair_services](#312-repair_services)
   - [suppliers](#313-suppliers)
   - [spare_parts](#314-spare_parts)
   - [inventory_transactions](#315-inventory_transactions)
   - [repair_parts](#316-repair_parts)
   - [purchase_orders](#317-purchase_orders)
   - [purchase_order_items](#318-purchase_order_items)
   - [invoices](#319-invoices)
   - [payments](#320-payments)
   - [refunds](#321-refunds)
   - [maintenance_history](#322-maintenance_history)
   - [notifications](#323-notifications)
   - [settings](#324-settings)
4. [Relationships Map](#4-relationships-map)
5. [Seed Data Summary](#5-seed-data-summary)

---

## 1. Entity Relationship Overview

```
┌──────────┐       ┌──────────┐       ┌───────────────┐
│  roles   │──1:N──│  users   │──1:1──│  employees    │
└──────────┘       └────┬─────┘       └───┬───────────┘
                        │                 │
                        │            ┌────┴──────────────┐
                        │            │                   │
                   ┌────┴────┐  ┌────┴──────────┐  ┌────┴──────────────┐
                   │ user_   │  │ employee_     │  │ employee_         │
                   │ sessions│  │ attendance    │  │ schedules         │
                   └─────────┘  └───────────────┘  └───────────────────┘

┌───────────┐       ┌───────────┐       ┌────────────────┐
│ customers │──1:N──│ vehicles  │──1:N──│ maintenance_   │
└─────┬─────┘       └─────┬─────┘       │ history        │
      │                   │             └────────────────┘
      │                   │
      └───────┬───────────┘
              │
        ┌─────┴──────────┐       ┌──────────────────┐
        │ appointments   │──1:1──│ repair_orders     │
        └────────────────┘       └──┬────────┬───────┘
                                    │        │
                              ┌─────┴──┐  ┌──┴──────────┐
                              │repair_ │  │repair_      │
                              │services│  │parts        │
                              └────────┘  └─────────────┘

┌───────────┐       ┌─────────────┐       ┌──────────────────────┐
│ suppliers │──1:N──│ spare_parts │──1:N──│ inventory_           │
└─────┬─────┘       └─────────────┘       │ transactions         │
      │                                   └──────────────────────┘
      │
┌─────┴──────────────┐       ┌────────────────────────┐
│ purchase_orders    │──1:N──│ purchase_order_items    │
└────────────────────┘       └────────────────────────┘

┌────────────────┐       ┌────────────┐       ┌──────────┐
│ repair_orders  │──1:1──│ invoices   │──1:N──│ payments │
└────────────────┘       └────────────┘       └────┬─────┘
                                                   │
                                              ┌────┴─────┐
                                              │ refunds  │
                                              └──────────┘

┌────────────────┐       ┌────────────┐
│ notifications  │       │ settings   │
└────────────────┘       └────────────┘
```

---

## 2. Custom ENUM Types

| Type Name | Values | Used In |
|---|---|---|
| `employment_status` | Active, On Leave, Terminated | `employees` |
| `attendance_status` | Present, Absent, Late, Half Day, On Leave | `employee_attendance` |
| `day_of_week` | Monday – Sunday | `employee_schedules` |
| `fuel_type` | Gasoline, Diesel, Electric, Hybrid, LPG | `vehicles` |
| `appointment_status` | Scheduled, Confirmed, In Progress, Completed, Cancelled | `appointments` |
| `repair_status` | Pending, Diagnosing, Repairing, Waiting for Parts, Ready for Pickup, Completed | `repair_orders` |
| `purchase_status` | Draft, Ordered, Received, Cancelled | `purchase_orders` |
| `invoice_status` | Draft, Issued, Paid, Partially Paid, Overdue, Cancelled, Refunded | `invoices` |
| `payment_method` | Cash, Credit/Debit Card, Bank Transfer, Mobile Payment, QR Payment | `payments`, `refunds` |
| `inventory_tx_type` | Stock In, Stock Out, Adjustment | `inventory_transactions` |
| `notification_type` | Appointment Reminder, Repair Completion, Low Stock Alert, Ready for Pickup, Next Service Reminder, General | `notifications` |

---

## 3. Table Documentation

---

### 3.1 `roles`
**Requirement:** 1 (User Authentication – RBAC)  
**Purpose:** Stores the different user roles that control system access.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing role ID |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Role name (e.g., Admin, Mechanic) |
| `description` | VARCHAR(255) | — | Brief description of the role |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

---

### 3.2 `users`
**Requirement:** 1 (User Authentication)  
**Purpose:** Stores login credentials and profile information for all system users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing user ID |
| `username` | VARCHAR(100) | NOT NULL, UNIQUE | Login username |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `full_name` | VARCHAR(255) | NOT NULL | Display name |
| `phone` | VARCHAR(20) | — | Contact phone number |
| `avatar_url` | VARCHAR(500) | — | URL to profile picture |
| `role_id` | INT | NOT NULL, FK → `roles.id` | Assigned role |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account enabled/disabled |
| `last_login` | TIMESTAMPTZ | — | Timestamp of last login |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Relationships:**
- Belongs to one `roles` record (`role_id`)
- Has one optional `employees` record

---

### 3.3 `user_sessions`
**Requirement:** 1 (User Authentication)  
**Purpose:** Tracks active login sessions for token-based authentication.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing session ID |
| `user_id` | INT | NOT NULL, FK → `users.id`, ON DELETE CASCADE | The logged-in user |
| `token` | VARCHAR(500) | NOT NULL, UNIQUE | Session/JWT token |
| `ip_address` | VARCHAR(45) | — | Client IP address |
| `user_agent` | VARCHAR(500) | — | Client browser/device info |
| `expires_at` | TIMESTAMPTZ | NOT NULL | When this session expires |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Session creation timestamp |

**Relationships:**
- Belongs to one `users` record (`user_id`)

---

### 3.4 `employees`
**Requirement:** 8 (Mechanic Management), 12 (Employee Management)  
**Purpose:** Stores employee-specific details. Extends the `users` table with HR information.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing employee ID |
| `user_id` | INT | NOT NULL, UNIQUE, FK → `users.id`, ON DELETE CASCADE | Linked user account |
| `employee_code` | VARCHAR(20) | NOT NULL, UNIQUE | Employee ID code (e.g., EMP-001) |
| `position` | VARCHAR(100) | — | Job title |
| `specialization` | VARCHAR(255) | — | Area of expertise (e.g., Engine, Electrical) |
| `experience_years` | INT | DEFAULT 0 | Years of experience |
| `hire_date` | DATE | — | Employment start date |
| `salary` | DECIMAL(12,2) | DEFAULT 0.00 | Monthly salary |
| `employment_status` | employment_status | DEFAULT 'Active' | Current employment status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Relationships:**
- Belongs to one `users` record (`user_id`, 1:1)
- Has many `employee_attendance` records
- Has many `employee_schedules` records
- Has many `appointments` as assigned mechanic
- Has many `repair_orders` as assigned mechanic

---

### 3.5 `employee_attendance`
**Requirement:** 12 (Employee Management – Attendance)  
**Purpose:** Tracks daily attendance for each employee.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing ID |
| `employee_id` | INT | NOT NULL, FK → `employees.id`, ON DELETE CASCADE | The employee |
| `date` | DATE | NOT NULL | Attendance date |
| `clock_in` | TIME | — | Clock-in time |
| `clock_out` | TIME | — | Clock-out time |
| `status` | attendance_status | DEFAULT 'Present' | Attendance status |
| `notes` | TEXT | — | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Constraints:** UNIQUE on (`employee_id`, `date`) — one record per employee per day.

---

### 3.6 `employee_schedules`
**Requirement:** 12 (Employee Management – Work Schedule)  
**Purpose:** Defines the weekly work schedule for each employee.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing ID |
| `employee_id` | INT | NOT NULL, FK → `employees.id`, ON DELETE CASCADE | The employee |
| `day` | day_of_week | NOT NULL | Day of the week |
| `start_time` | TIME | NOT NULL | Shift start time |
| `end_time` | TIME | NOT NULL | Shift end time |
| `is_day_off` | BOOLEAN | DEFAULT FALSE | Whether this is a day off |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Constraints:** UNIQUE on (`employee_id`, `day`) — one schedule entry per day per employee.

---

### 3.7 `customers`
**Requirement:** 3 (Customer Management)  
**Purpose:** Stores customer personal and contact information.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing customer ID |
| `customer_code` | VARCHAR(20) | NOT NULL, UNIQUE | Customer ID code (e.g., CUST-001) |
| `full_name` | VARCHAR(255) | NOT NULL | Customer full name |
| `phone` | VARCHAR(20) | — | Phone number |
| `email` | VARCHAR(255) | — | Email address |
| `address` | TEXT | — | Home/billing address |
| `registration_date` | DATE | DEFAULT CURRENT_DATE | Date of registration |
| `notes` | TEXT | — | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Indexes:** `idx_customer_name` (full_name), `idx_customer_phone` (phone)

**Relationships:**
- Has many `vehicles`
- Has many `appointments`
- Has many `repair_orders`
- Has many `invoices`

---

### 3.8 `vehicles`
**Requirement:** 4 (Vehicle Management)  
**Purpose:** Stores detailed vehicle information, linked to a customer owner.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing vehicle ID |
| `customer_id` | INT | NOT NULL, FK → `customers.id`, ON DELETE CASCADE | Owner customer |
| `vehicle_number` | VARCHAR(20) | NOT NULL | License plate number |
| `vin` | VARCHAR(50) | — | Vehicle Identification Number (optional) |
| `brand` | VARCHAR(100) | — | Vehicle brand (e.g., Toyota) |
| `model` | VARCHAR(100) | — | Vehicle model (e.g., Camry) |
| `year` | INT | — | Manufacturing year |
| `color` | VARCHAR(50) | — | Vehicle color |
| `engine_number` | VARCHAR(100) | — | Engine serial number |
| `fuel_type` | fuel_type | DEFAULT 'Gasoline' | Type of fuel used |
| `mileage` | INT | DEFAULT 0 | Current odometer reading |
| `photo_url` | VARCHAR(500) | — | URL to uploaded vehicle photo |
| `notes` | TEXT | — | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Indexes:** `idx_vehicle_number`, `idx_vehicle_vin`

**Relationships:**
- Belongs to one `customers` record (`customer_id`)
- Has many `appointments`
- Has many `repair_orders`
- Has many `maintenance_history` records

---

### 3.9 `services`
**Requirement:** 7 (Service Management)  
**Purpose:** Catalog of all repair/maintenance services offered by the shop.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing service ID |
| `name` | VARCHAR(255) | NOT NULL | Service name (e.g., Oil Change) |
| `description` | TEXT | — | Detailed description |
| `estimated_cost` | DECIMAL(12,2) | DEFAULT 0.00 | Standard price |
| `estimated_hours` | DECIMAL(5,2) | DEFAULT 0.00 | Estimated labor hours |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether this service is currently offered |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Index:** `idx_service_name`

---

### 3.10 `appointments`
**Requirement:** 5 (Appointment Management)  
**Purpose:** Tracks scheduled service appointments.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing appointment ID |
| `appointment_code` | VARCHAR(20) | NOT NULL, UNIQUE | Appointment reference code |
| `customer_id` | INT | NOT NULL, FK → `customers.id` | The customer |
| `vehicle_id` | INT | NOT NULL, FK → `vehicles.id` | The vehicle being serviced |
| `mechanic_id` | INT | FK → `employees.id` | Assigned mechanic (nullable) |
| `scheduled_date` | DATE | NOT NULL | Appointment date |
| `scheduled_time` | TIME | — | Appointment time |
| `status` | appointment_status | DEFAULT 'Scheduled' | Current appointment status |
| `notes` | TEXT | — | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Indexes:** `idx_appointment_date`, `idx_appointment_status`

**Status Flow:** `Scheduled` → `Confirmed` → `In Progress` → `Completed` (or `Cancelled` at any point)

---

### 3.11 `repair_orders`
**Requirement:** 6 (Repair Job Management)  
**Purpose:** The core work order table. Tracks the entire lifecycle of a repair job.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing repair order ID |
| `order_number` | VARCHAR(20) | NOT NULL, UNIQUE | Work order reference number |
| `appointment_id` | INT | FK → `appointments.id`, ON DELETE SET NULL | Linked appointment (optional) |
| `customer_id` | INT | NOT NULL, FK → `customers.id` | The customer |
| `vehicle_id` | INT | NOT NULL, FK → `vehicles.id` | The vehicle being repaired |
| `mechanic_id` | INT | FK → `employees.id` | Assigned mechanic |
| `problem_description` | TEXT | — | Customer-reported issue |
| `diagnosis` | TEXT | — | Mechanic's diagnosis |
| `estimated_cost` | DECIMAL(12,2) | DEFAULT 0.00 | Quoted cost |
| `actual_cost` | DECIMAL(12,2) | DEFAULT 0.00 | Final cost after completion |
| `status` | repair_status | DEFAULT 'Pending' | Current repair status |
| `started_at` | TIMESTAMPTZ | — | When work began |
| `completed_at` | TIMESTAMPTZ | — | When work was completed |
| `notes` | TEXT | — | Internal notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Indexes:** `idx_repair_status`, `idx_repair_order_number`

**Status Flow:** `Pending` → `Diagnosing` → `Repairing` → `Waiting for Parts` → `Ready for Pickup` → `Completed`

**Relationships:**
- Belongs to one `customers`, one `vehicles`, optionally one `appointments`, optionally one `employees`
- Has many `repair_services` (services performed)
- Has many `repair_parts` (parts used)
- Has one `invoices` record (billing)

---

### 3.12 `repair_services`
**Requirement:** 6 (Repair Job Management – Add Repair Services)  
**Purpose:** Junction table linking a repair order to the services performed.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing ID |
| `repair_order_id` | INT | NOT NULL, FK → `repair_orders.id`, ON DELETE CASCADE | The repair order |
| `service_id` | INT | NOT NULL, FK → `services.id` | The service performed |
| `quantity` | INT | DEFAULT 1 | Number of times service was performed |
| `unit_price` | DECIMAL(12,2) | NOT NULL | Price per unit at time of service |
| `total_price` | DECIMAL(12,2) | NOT NULL | quantity × unit_price |
| `notes` | TEXT | — | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

---

### 3.13 `suppliers`
**Requirement:** 10 (Supplier Management)  
**Purpose:** Stores supplier/vendor contact information.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing supplier ID |
| `name` | VARCHAR(255) | NOT NULL | Supplier company name |
| `contact_name` | VARCHAR(255) | — | Primary contact person |
| `phone` | VARCHAR(20) | — | Phone number |
| `email` | VARCHAR(255) | — | Email address |
| `address` | TEXT | — | Business address |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether currently active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Index:** `idx_supplier_name`

---

### 3.14 `spare_parts`
**Requirement:** 9 (Spare Parts Inventory Management)  
**Purpose:** Inventory catalog of all spare parts in stock.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing part ID |
| `part_code` | VARCHAR(50) | NOT NULL, UNIQUE | Part SKU/code (e.g., BRK-001) |
| `name` | VARCHAR(255) | NOT NULL | Part name |
| `category` | VARCHAR(100) | — | Category (e.g., Brakes, Engine, Electrical) |
| `brand` | VARCHAR(100) | — | Manufacturer brand |
| `unit_price` | DECIMAL(12,2) | DEFAULT 0.00 | Selling price per unit |
| `stock_quantity` | INT | DEFAULT 0 | Current quantity in stock |
| `min_stock` | INT | DEFAULT 5 | Low stock alert threshold |
| `supplier_id` | INT | FK → `suppliers.id`, ON DELETE SET NULL | Primary supplier |
| `location` | VARCHAR(100) | — | Storage location in warehouse |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether part is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Indexes:** `idx_part_code`, `idx_part_name`, `idx_part_category`

**Low Stock Alert Logic:** When `stock_quantity` < `min_stock`, the part should appear in the Low Stock Alert on the Dashboard (Requirement 2) and trigger a notification (Requirement 15).

---

### 3.15 `inventory_transactions`
**Requirement:** 9 (Spare Parts – Stock In, Stock Out, Adjustment)  
**Purpose:** Audit trail for every inventory movement.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing transaction ID |
| `spare_part_id` | INT | NOT NULL, FK → `spare_parts.id` | The affected part |
| `type` | inventory_tx_type | NOT NULL | Stock In, Stock Out, or Adjustment |
| `quantity` | INT | NOT NULL | Quantity moved (positive for in, negative for out) |
| `reference_id` | INT | — | ID of the related record (e.g., repair_order or purchase_order) |
| `reference_type` | VARCHAR(50) | — | Type of reference (e.g., 'repair_order', 'purchase_order') |
| `notes` | TEXT | — | Reason for the transaction |
| `performed_by` | INT | FK → `users.id` | User who performed this action |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Transaction timestamp |

---

### 3.16 `repair_parts`
**Requirement:** 6, 9 (Parts used in repairs)  
**Purpose:** Junction table tracking which spare parts were used in a specific repair order.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing ID |
| `repair_order_id` | INT | NOT NULL, FK → `repair_orders.id`, ON DELETE CASCADE | The repair order |
| `spare_part_id` | INT | NOT NULL, FK → `spare_parts.id` | The part used |
| `quantity` | INT | NOT NULL, DEFAULT 1 | Quantity used |
| `unit_price` | DECIMAL(12,2) | NOT NULL | Price at time of use |
| `total_price` | DECIMAL(12,2) | NOT NULL | quantity × unit_price |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

---

### 3.17 `purchase_orders`
**Requirement:** 10 (Supplier Management – Purchase Spare Parts)  
**Purpose:** Tracks orders placed with suppliers to restock spare parts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing purchase order ID |
| `order_number` | VARCHAR(20) | NOT NULL, UNIQUE | PO reference number |
| `supplier_id` | INT | NOT NULL, FK → `suppliers.id` | The supplier |
| `total_amount` | DECIMAL(12,2) | DEFAULT 0.00 | Total order cost |
| `status` | purchase_status | DEFAULT 'Draft' | Order status |
| `ordered_by` | INT | FK → `users.id` | User who placed the order |
| `order_date` | DATE | — | Date order was placed |
| `received_date` | DATE | — | Date goods were received |
| `notes` | TEXT | — | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

---

### 3.18 `purchase_order_items`
**Requirement:** 10 (Supplier Management – Purchase History)  
**Purpose:** Line items within a purchase order.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing ID |
| `purchase_order_id` | INT | NOT NULL, FK → `purchase_orders.id`, ON DELETE CASCADE | Parent PO |
| `spare_part_id` | INT | NOT NULL, FK → `spare_parts.id` | The part being ordered |
| `quantity` | INT | NOT NULL | Quantity ordered |
| `unit_price` | DECIMAL(12,2) | NOT NULL | Cost per unit |
| `total_price` | DECIMAL(12,2) | NOT NULL | quantity × unit_price |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

---

### 3.19 `invoices`
**Requirement:** 11 (Invoice & Payment Management)  
**Purpose:** Billing records generated from completed repair orders.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing invoice ID |
| `invoice_number` | VARCHAR(20) | NOT NULL, UNIQUE | Invoice reference number |
| `repair_order_id` | INT | NOT NULL, FK → `repair_orders.id` | The completed repair order |
| `customer_id` | INT | NOT NULL, FK → `customers.id` | The billed customer |
| `subtotal` | DECIMAL(12,2) | DEFAULT 0.00 | Total before tax and discount |
| `tax_rate` | DECIMAL(5,2) | DEFAULT 0.00 | Applied tax percentage |
| `tax_amount` | DECIMAL(12,2) | DEFAULT 0.00 | Calculated tax amount |
| `discount` | DECIMAL(12,2) | DEFAULT 0.00 | Discount applied |
| `total_amount` | DECIMAL(12,2) | DEFAULT 0.00 | Final amount (subtotal + tax − discount) |
| `amount_paid` | DECIMAL(12,2) | DEFAULT 0.00 | Sum of all payments received |
| `balance_due` | DECIMAL(12,2) | DEFAULT 0.00 | total_amount − amount_paid |
| `status` | invoice_status | DEFAULT 'Draft' | Invoice status |
| `issued_date` | DATE | — | Date invoice was issued |
| `due_date` | DATE | — | Payment due date |
| `notes` | TEXT | — | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Indexes:** `idx_invoice_number`, `idx_invoice_status`

**Status Flow:** `Draft` → `Issued` → `Paid` / `Partially Paid` / `Overdue` (or `Cancelled` / `Refunded`)

---

### 3.20 `payments`
**Requirement:** 11 (Invoice & Payment – Record Payment)  
**Purpose:** Individual payment transactions against an invoice.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing payment ID |
| `payment_number` | VARCHAR(20) | NOT NULL, UNIQUE | Payment reference number |
| `invoice_id` | INT | NOT NULL, FK → `invoices.id` | The invoice being paid |
| `amount` | DECIMAL(12,2) | NOT NULL | Amount of this payment |
| `payment_method` | payment_method | NOT NULL | Method of payment |
| `payment_date` | DATE | NOT NULL | Date payment was received |
| `reference_no` | VARCHAR(100) | — | Bank/card transaction reference |
| `received_by` | INT | FK → `users.id` | Cashier who received payment |
| `notes` | TEXT | — | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Index:** `idx_payment_date`

---

### 3.21 `refunds`
**Requirement:** 11 (Invoice & Payment – Refund Management)  
**Purpose:** Tracks refunds issued against previous payments.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing refund ID |
| `payment_id` | INT | NOT NULL, FK → `payments.id` | Original payment being refunded |
| `invoice_id` | INT | NOT NULL, FK → `invoices.id` | Related invoice |
| `amount` | DECIMAL(12,2) | NOT NULL | Refund amount |
| `reason` | TEXT | — | Reason for refund |
| `refund_method` | payment_method | NOT NULL | Refund method |
| `refund_date` | DATE | NOT NULL | Date refund was processed |
| `processed_by` | INT | FK → `users.id` | User who processed the refund |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

---

### 3.22 `maintenance_history`
**Requirement:** 13 (Maintenance History Management)  
**Purpose:** Long-term vehicle service history log with warranty and next-service tracking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing ID |
| `vehicle_id` | INT | NOT NULL, FK → `vehicles.id`, ON DELETE CASCADE | The vehicle |
| `repair_order_id` | INT | FK → `repair_orders.id`, ON DELETE SET NULL | Linked repair order |
| `service_date` | DATE | NOT NULL | Date of service |
| `description` | TEXT | — | Summary of work performed |
| `parts_replaced` | TEXT | — | List of parts replaced |
| `repair_cost` | DECIMAL(12,2) | DEFAULT 0.00 | Total cost of this service |
| `mileage_at_service` | INT | — | Odometer reading at time of service |
| `next_service_date` | DATE | — | Recommended next service date |
| `next_service_mileage` | INT | — | Recommended next service mileage |
| `next_service_description` | TEXT | — | What needs to be done next |
| `warranty_expiry_date` | DATE | — | Warranty end date for this service |
| `warranty_notes` | TEXT | — | Warranty terms and conditions |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Indexes:** `idx_maintenance_vehicle`, `idx_maintenance_date`

---

### 3.23 `notifications`
**Requirement:** 15 (Notification System)  
**Purpose:** In-app notification alerts for users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing notification ID |
| `user_id` | INT | FK → `users.id`, ON DELETE CASCADE | Target user (NULL = system-wide) |
| `type` | notification_type | NOT NULL | Category of notification |
| `title` | VARCHAR(255) | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Notification body text |
| `is_read` | BOOLEAN | DEFAULT FALSE | Whether user has read this |
| `reference_id` | INT | — | ID of related record |
| `reference_type` | VARCHAR(50) | — | Type of related record (e.g., 'appointment', 'repair_order') |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Notification creation timestamp |

**Indexes:** `idx_notification_user`, `idx_notification_read`

---

### 3.24 `settings`
**Requirement:** 16 (Settings)  
**Purpose:** Key-value configuration store for workshop settings.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PK | Auto-incrementing ID |
| `setting_key` | VARCHAR(100) | NOT NULL, UNIQUE | Setting identifier |
| `setting_value` | TEXT | — | Setting value |
| `category` | VARCHAR(50) | — | Group (Workshop, Tax, Currency, etc.) |
| `description` | VARCHAR(255) | — | Human-readable description |
| `updated_by` | INT | FK → `users.id` | Last user to modify |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), auto-trigger | Last modification timestamp |

**Indexes:** `idx_setting_key`, `idx_setting_category`

---

## 4. Relationships Map

| Parent Table | Child Table | FK Column | Relationship | ON DELETE |
|---|---|---|---|---|
| `roles` | `users` | `role_id` | 1:N | RESTRICT |
| `users` | `user_sessions` | `user_id` | 1:N | CASCADE |
| `users` | `employees` | `user_id` | 1:1 | CASCADE |
| `employees` | `employee_attendance` | `employee_id` | 1:N | CASCADE |
| `employees` | `employee_schedules` | `employee_id` | 1:N | CASCADE |
| `customers` | `vehicles` | `customer_id` | 1:N | CASCADE |
| `customers` | `appointments` | `customer_id` | 1:N | RESTRICT |
| `customers` | `repair_orders` | `customer_id` | 1:N | RESTRICT |
| `customers` | `invoices` | `customer_id` | 1:N | RESTRICT |
| `vehicles` | `appointments` | `vehicle_id` | 1:N | RESTRICT |
| `vehicles` | `repair_orders` | `vehicle_id` | 1:N | RESTRICT |
| `vehicles` | `maintenance_history` | `vehicle_id` | 1:N | CASCADE |
| `employees` | `appointments` | `mechanic_id` | 1:N | RESTRICT |
| `employees` | `repair_orders` | `mechanic_id` | 1:N | RESTRICT |
| `appointments` | `repair_orders` | `appointment_id` | 1:1 | SET NULL |
| `repair_orders` | `repair_services` | `repair_order_id` | 1:N | CASCADE |
| `repair_orders` | `repair_parts` | `repair_order_id` | 1:N | CASCADE |
| `repair_orders` | `invoices` | `repair_order_id` | 1:1 | RESTRICT |
| `repair_orders` | `maintenance_history` | `repair_order_id` | 1:N | SET NULL |
| `services` | `repair_services` | `service_id` | 1:N | RESTRICT |
| `suppliers` | `spare_parts` | `supplier_id` | 1:N | SET NULL |
| `suppliers` | `purchase_orders` | `supplier_id` | 1:N | RESTRICT |
| `spare_parts` | `inventory_transactions` | `spare_part_id` | 1:N | RESTRICT |
| `spare_parts` | `repair_parts` | `spare_part_id` | 1:N | RESTRICT |
| `spare_parts` | `purchase_order_items` | `spare_part_id` | 1:N | RESTRICT |
| `purchase_orders` | `purchase_order_items` | `purchase_order_id` | 1:N | CASCADE |
| `invoices` | `payments` | `invoice_id` | 1:N | RESTRICT |
| `payments` | `refunds` | `payment_id` | 1:N | RESTRICT |
| `invoices` | `refunds` | `invoice_id` | 1:N | RESTRICT |
| `users` | `notifications` | `user_id` | 1:N | CASCADE |
| `users` | `settings` | `updated_by` | 1:N | RESTRICT |

---

## 5. Seed Data Summary

### Default Roles (6)
| ID | Name | Description |
|---|---|---|
| 1 | Admin | Full system access and configuration |
| 2 | Manager | Manage operations, employees, and reports |
| 3 | Service Advisor | Handle customers, appointments, and repair orders |
| 4 | Mechanic | View and update assigned repair jobs |
| 5 | Cashier | Manage invoices and payments |
| 6 | Storekeeper | Manage spare parts inventory and suppliers |

### Default Services (9)
| Name | Estimated Cost |
|---|---|
| Oil Change | $50.00 |
| Engine Repair | $500.00 |
| Brake Service | $200.00 |
| Tire Replacement | $80.00 |
| Battery Replacement | $150.00 |
| Air Conditioning Repair | $300.00 |
| Wheel Alignment | $75.00 |
| Car Wash | $30.00 |
| General Inspection | $60.00 |

### Default Settings (13)
| Key | Value | Category |
|---|---|---|
| workshop_name | Auto Repair Shop | Workshop |
| workshop_address | *(empty)* | Workshop |
| workshop_phone | *(empty)* | Workshop |
| workshop_email | *(empty)* | Workshop |
| workshop_logo | *(empty)* | Workshop |
| tax_rate | 7 | Tax |
| tax_name | VAT | Tax |
| currency | USD | Currency |
| currency_symbol | $ | Currency |
| business_hours_open | 08:00 | Business Hours |
| business_hours_close | 18:00 | Business Hours |
| business_days | Monday–Saturday | Business Hours |
| low_stock_threshold | 5 | Inventory |

### Default Admin User
| Username | Email | Password | Role |
|---|---|---|---|
| admin | admin@carrepair.com | admin123 | Admin |
