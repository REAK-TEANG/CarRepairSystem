import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './layouts/AppLayout'

// Organized Page Imports via Domain Barrel
import {
  LoginPage,
  UnauthorizedPage,
  AdminDashboard,
  MechanicDashboard,
  AppointmentsPage,
  RepairJobsPage,
  CustomersPage,
  VehiclesPage,
  InventoryPage,
  SuppliersPage,
  ServicesPage,
  MechanicsPage,
  InvoicesPage,
  EmployeesPage,
  ReportsPage,
  SettingsPage,
} from './pages'

import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1,
    },
  },
})

// Helper to determine the default landing page for each of the 6 RBAC roles
function RoleBasedHome() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  switch (user.role) {
    case 'admin':
    case 'manager':
      return <Navigate to="/admin/dashboard" replace />
    case 'mechanic':
      return <Navigate to="/mechanic/dashboard" replace />
    case 'service_advisor':
      return <Navigate to="/appointments" replace />
    case 'cashier':
      return <Navigate to="/invoices" replace />
    case 'storekeeper':
      return <Navigate to="/inventory" replace />
    default:
      return <Navigate to="/unauthorized" replace />
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected App Shell Layout */}
                <Route path="/" element={<AppLayout />}>
                  {/* Index redirects to role-appropriate home */}
                  <Route index element={<RoleBasedHome />} />

                  {/* Dashboards */}
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                    <Route path="admin/dashboard" element={<AdminDashboard />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['mechanic']} />}>
                    <Route path="mechanic/dashboard" element={<MechanicDashboard />} />
                  </Route>

                  {/* Operations */}
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'service_advisor']} />}>
                    <Route path="appointments" element={<AppointmentsPage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'service_advisor', 'mechanic']} />}>
                    <Route path="repair-jobs" element={<RepairJobsPage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'service_advisor', 'cashier']} />}>
                    <Route path="customers" element={<CustomersPage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'service_advisor', 'mechanic']} />}>
                    <Route path="vehicles" element={<VehiclesPage />} />
                  </Route>

                  {/* Workshop & Supply */}
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'storekeeper', 'mechanic']} />}>
                    <Route path="inventory" element={<InventoryPage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'storekeeper']} />}>
                    <Route path="suppliers" element={<SuppliersPage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'service_advisor']} />}>
                    <Route path="services" element={<ServicesPage />} />
                    <Route path="mechanics" element={<MechanicsPage />} />
                  </Route>

                  {/* Management & Finance */}
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'service_advisor', 'cashier']} />}>
                    <Route path="invoices" element={<InvoicesPage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<RoleBasedHome />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
