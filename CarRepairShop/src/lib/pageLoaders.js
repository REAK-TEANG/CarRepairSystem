// Single source of truth for lazily loaded pages. App.jsx wraps these in lazy();
// lib/prefetch.js calls them early so the chunk is already cached when a link is clicked.
export const pageLoaders = {
  LoginPage: () => import('../pages/auth/LoginPage'),
  UnauthorizedPage: () => import('../pages/auth/UnauthorizedPage'),
  AdminDashboard: () => import('../pages/dashboards/AdminDashboard'),
  MechanicDashboard: () => import('../pages/dashboards/MechanicDashboard'),
  AppointmentsPage: () => import('../pages/operations/AppointmentsPage'),
  RepairJobsPage: () => import('../pages/operations/RepairJobsPage'),
  CustomersPage: () => import('../pages/operations/CustomersPage'),
  VehiclesPage: () => import('../pages/operations/VehiclesPage'),
  InventoryPage: () => import('../pages/workshop/InventoryPage'),
  SuppliersPage: () => import('../pages/workshop/SuppliersPage'),
  ServicesPage: () => import('../pages/workshop/ServicesPage'),
  MechanicsPage: () => import('../pages/workshop/MechanicsPage'),
  InvoicesPage: () => import('../pages/management/InvoicesPage'),
  EmployeesPage: () => import('../pages/management/EmployeesPage'),
  ReportsPage: () => import('../pages/management/ReportsPage'),
  SettingsPage: () => import('../pages/management/SettingsPage'),
  AuditLogsPage: () => import('../pages/management/AuditLogsPage'),
}
