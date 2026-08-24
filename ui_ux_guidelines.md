# Car Repair System — UI/UX Guidelines & Frontend Implementation Reference

This document serves as the authoritative source of truth and architectural reference for the UI/UX design system, visual guidelines, component standards, and frontend implementation patterns used across the **Car Repair Shop Management System**.

---

## 1. Core Design Philosophy

> **The Precision Utility Directive:**  
> "Design a clean, intentional user interface for Car Repair Shop Management System that prioritizes high information density, precise typographic hierarchy, and genuine utility. Avoid generic AI tropes: no glowing neon gradients, no random floating glassmorphism cards, no corporate Memphis illustrations, and no overly rounded pill shapes. Rely on crisp 1px borders, structured grids, theme-adaptive neutrals, and high-contrast typography. The interface must feel like a reliable, professional tool engineered for workshop speed, rapid scannability, and operational clarity."

### Core Principles
1. **High Information Density & Utility:** Structured for fast scanning by service advisors, mechanics, and managers during busy workshop operations.
2. **Dual-Theme Balance (Precision Light & Obsidian Dark):** True CSS variable-driven theming supporting low-glare dark mode and high-clarity daylight mode.
3. **Restrained Color Hierarchy:** Grounded slate/graphite neutrals accented by functional semantic states and Precision Blue (`#2563EB` / `#3B82F6`) or Electric Lime highlights for primary CTAs.
4. **Crisp Structural Geometry:** Structured 1px border dividers (`--border-color`), clean 8px/12px border radii (`rounded-lg`, `rounded-xl`), and subtle micro-shadows.

---

## 2. Color Palette & Theme Tokens

The design system uses CSS custom properties (`index.css`) bound directly to Tailwind CSS `app-*` utility classes (`tailwind.config.js`).

### Theme Token Mapping

| Token Name | Light Mode Value | Dark Mode (Obsidian) | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` / `app-bg` | `#F4F5F7` (Soft slate) | `#0F1318` (Deep graphite slate) | Main application canvas / body |
| `--bg-card` / `app-card` | `#FFFFFF` (Pure white) | `#161C24` (Solid dark card) | Cards, tables, modals, sidebars |
| `--bg-hover` / `app-hover` | `#ECEEF2` (Subtle hover) | `#1F2633` (Deepened hover) | Row hovers, ghost button backgrounds |
| `--bg-input` / `app-input` | `#FFFFFF` (Clean white) | `#121720` (Dark inset input) | Form text fields, dropdowns, selects |
| `--border-color` / `app-border` | `#E2E4E9` (Light gray border) | `#273142` (Subtle slate border) | 1px dividers, card/table borders |
| `--text-primary` / `app-text` | `#111827` (Near black) | `#F3F4F6` (Off-white) | Headings, primary values, active text |
| `--text-secondary` / `app-muted`| `#4B5563` (Slate gray) | `#9CA3AF` (Muted slate) | Subheadings, labels, secondary copy |
| `--text-muted` / `app-caption` | `#6B7280` (Muted gray) | `#6B7280` (Caption gray) | Micro captions, helper hints, timestamps |
| `--accent-primary` / `app-accent`| `#2563EB` (Precision Blue) | `#3B82F6` (Electric Precision Blue)| Primary actions, active navigation |
| `--accent-hover` | `#1D4ED8` | `#2563EB` | Button hover state |
| `--accent-text` / `app-accentText`| `#FFFFFF` (White) | `#FFFFFF` (White) | Text inside primary accent buttons/pills |

### Semantic Status Colors

All status indicators use a semi-transparent tinted container paired with a high-contrast label and solid colored dot indicator:

* **Success (`emerald`):** `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20` (`Completed`, `Ready for Pickup`, `Confirmed`, `Paid`, `Present`)
* **Warning (`amber`):** `bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20` (`Diagnosing`, `Pending`, `Waiting for Parts`, `On Leave`, `Low Stock`)
* **Danger (`red`):** `bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20` (`Cancelled`, `Overdue`, `Critical`, `Out of Stock`)
* **Info (`blue`):** `bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20` (`Repairing`, `Scheduled`, `In Progress`, `Issued`)
* **Neutral (`slate`):** `bg-app-hover text-app-muted border-app-border` (`Draft`, `Archived`, `Inactive`)

---

## 3. Typography & Numerical Formatting

* **Font Stack:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
* **Numbers & Metric Data:** Always apply `.tabular-nums` (`font-variant-numeric: tabular-nums`) and `font-bold` for aligned figures, financial amounts, and counters.
* **Identifier Codes:** Staff codes (`EMP-001`), VINs, License Plates (`ABC-1234`), and Invoices (`INV-2026-001`) must use `font-mono font-semibold text-app-accent`.
* **Weight Hierarchy:**
  * **Page Titles (h1):** `text-xl font-bold tracking-tight text-app-text`
  * **Card & Section Titles (h2, h3):** `text-sm font-bold text-app-text` / `text-xs font-semibold uppercase tracking-wider text-app-muted`
  * **Navigation Links:** `text-xs font-medium` (Active: `font-semibold`)
  * **Table & Body Copy:** `text-xs font-normal text-app-text`

---

## 4. Component Design Patterns & Standards

### A. Navigation & Layout (`AppLayout.jsx`, `Sidebar.jsx`, `TopBar.jsx`)
* **Sidebar Collapsing:** Supports expanded (256px / `w-64`) and compact icon-only (76px / `w-[76px]`) modes, preserved during user session.
* **Categorized Navigation:** Grouped into distinct operational domains:
  1. *Dashboards* (Admin Dashboard, Mechanic Workspace)
  2. *Operations* (Appointments, Repair Jobs, Customers, Vehicles)
  3. *Workshop & Supply* (Inventory & Parts, Suppliers, Service Catalog, Mechanics Roster)
  4. *Management* (Invoices & Billing, Staff & Employees, Reports & Analytics, System Settings)
* **Mobile Drawer:** Off-canvas sliding drawer with `bg-black/60 backdrop-blur-sm` overlay and touch dismiss.

### B. Summary Stat Cards (`StatCard.jsx`)
* **Structure:** `bg-app-card rounded-xl border border-app-border p-4 shadow-card`
* **Contents:** Upper label (`text-xs uppercase text-app-muted`), primary figure (`text-xl font-bold tabular-nums`), optional right icon badge (`bg-app-hover p-2 rounded-lg`), bottom divider with trend delta (`+12%` with Phosphor `TrendUp`/`TrendDown`) and goal targets.

### C. Status Badges (`StatusBadge.jsx`)
* Rendered as:
  ```jsx
  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border">
    <span className="w-1.5 h-1.5 rounded-full bg-[color]" />
    {status}
  </span>
  ```

### D. Modals & Dialogs (`Modal.jsx`)
* **Backdrop:** Fixed overlay `bg-black/60 backdrop-blur-sm` with `animate-fade-in`.
* **Keyboard Navigation:** Automatic `Escape` key close listener and `document.body.style.overflow = 'hidden'` scroll locking.
* **Layout:** Responsive max-width container (`max-w-lg` default, customizable to `max-w-2xl` / `max-w-4xl`), structured sticky header with close button, scrollable body (`max-h-[90vh] overflow-y-auto`), and standard action footer (`Cancel` + Primary CTA).

---

## 5. Media, Photo Upload & Avatar Guidelines

Specialized domain rules have been established for entity photos across the frontend and backend:

### 1. Vehicles (`VehiclesPage.jsx`)
* **Table Thumbnail:** 48px × 36px (`w-12 h-9`) rounded rectangular thumbnail (`rounded-md object-cover border border-app-border`) with a fallback `Car` Phosphor icon.
* **Upload Input:** In Add & Edit modals, supports local file selection via HTML5 `<input type="file" accept="image/*" />`, encoded immediately to Base64 via `FileReader` with live image preview and clear/replace buttons.
* **Detail Showcase View:** Modal renders a hero banner (192px height / `h-48`) displaying the vehicle photo with embedded vehicle status, fuel type, and year overlays.
* **Database & API:** Column `photo_url TEXT` in `vehicles` table supports both large Base64 data URLs and external URLs; Express backend allows payloads up to `50mb`.

### 2. Staff & Employees (`EmployeesPage.jsx`)
* **Avatar Display:** 32px × 32px (`w-8 h-8 rounded-full object-cover border border-app-border`) circular avatar in the table row and 40px × 40px in profile modal.
* **Fallback:** Circular initials badge (`w-8 h-8 rounded-full bg-app-accent/15 border border-app-accent/30 text-app-accent font-bold text-xs`).
* **Upload Input:** Add & Edit modals provide circular profile photo upload with live instant preview.
* **Database & API:** Column `photo_url TEXT` in `employees` table with auto-migration and `50mb` payload parsing.

### 3. Customers (`CustomersPage.jsx`)
* **Directive:** Customer photos are **strictly omitted** from tables and forms (as personal photos are neither expected nor collected from walk-in workshop clients).
* **Representation:** Replaced with clean typography, phone/email contact badges, and a minimal `User` icon badge in the customer profile inspection modal.

---

## 6. Table & List View Standards

* **Search & Filters:** Top bar with search input (`pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-lg text-xs`) and horizontal scrollable category pills.
* **Responsive Column Hiding:**
  * Primary information (ID, Title/Name, Status, Actions) always visible.
  * Secondary info (Phone, Contact, VIN) visible on `md:` breakpoint (`hidden md:table-cell`).
  * Tertiary info (Base Pay, Year, Address) visible on `lg:` breakpoint (`hidden lg:table-cell`).
* **Row Interactions:** `hover:bg-app-hover/60 transition-colors` with action icon buttons (`Eye`, `PencilSimple`, `Trash`) grouped in the rightmost cell.

---

## 7. Role-Based Access Control (RBAC) UI Rules

Role checks are enforced via `useAuth().can(resource, action)`:

| Role | Permitted Access Scope | Navigation Items Visible |
| :--- | :--- | :--- |
| **`admin`** | Full CRUD on all modules, financial reporting, staff management, settings | All 12 pages |
| **`manager`** | Full CRUD on operations, staff, workshop, inventory, and reporting | All operational & management pages |
| **`service_advisor`** | Create & manage Appointments, Repair Jobs, Customers, Invoices, Services | Appointments, Jobs, Customers, Vehicles, Services, Invoices |
| **`mechanic`** | View & update assigned Repair Jobs, inspect Vehicles & Parts inventory | Mechanic Workspace, Repair Jobs, Vehicles, Inventory |
| **`cashier`** | View Invoices, process payments, view Customers | Customers, Invoices & Billing |
| **`storekeeper`** | Full inventory management, supplier orders, parts tracking | Inventory & Parts, Suppliers |

Buttons for actions restricted to certain roles (e.g. `Add Staff`, `Delete Customer`, `Edit Invoice`) must be wrapped in `can(resource, action)` conditional blocks to prevent unauthorized actions.

---

## 8. Backend & API Conventions

* **Payload Limits:** Express configured with `express.json({ limit: '50mb' })` and `express.urlencoded({ limit: '50mb', extended: true })` to support image uploads.
* **Database Resiliency:** `photo_url TEXT` auto-migrated on server startup in `server/db.js` for both `vehicles` and `employees` tables.
* **Optimistic UI:** React Query mutations use optimistic cache updates (`onMutate`) with automatic rollback (`onError`) and cache invalidation (`onSettled`) for instantaneous UI responsiveness.
