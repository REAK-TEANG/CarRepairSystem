import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './layouts/AppLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { LoadingSpinner } from './components/ui'

// Lazy-Loaded Page Modules
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const UnauthorizedPage = lazy(() => import('./pages/auth/UnauthorizedPage'))
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard'))
const MechanicDashboard = lazy(() => import('./pages/dashboards/MechanicDashboard'))
const AppointmentsPage = lazy(() => import('./pages/operations/AppointmentsPage'))
const RepairJobsPage = lazy(() => import('./pages/operations/RepairJobsPage'))
const CustomersPage = lazy(() => import('./pages/operations/CustomersPage'))
const VehiclesPage = lazy(() => import('./pages/operations/VehiclesPage'))
const InventoryPage = lazy(() => import('./pages/workshop/InventoryPage'))
const SuppliersPage = lazy(() => import('./pages/workshop/SuppliersPage'))
const ServicesPage = lazy(() => import('./pages/workshop/ServicesPage'))
const MechanicsPage = lazy(() => import('./pages/workshop/MechanicsPage'))
const InvoicesPage = lazy(() => import('./pages/management/InvoicesPage'))
const EmployeesPage = lazy(() => import('./pages/management/EmployeesPage'))
const ReportsPage = lazy(() => import('./pages/management/ReportsPage'))
const SettingsPage = lazy(() => import('./pages/management/SettingsPage'))

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
              <Suspense fallback={<LoadingSpinner />}>
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

                    <Route element={<ProtectedRoute allowedRoles={['admin', 'mechanic', 'manager']} />}>
                      <Route path="mechanic/dashboard" element={<MechanicDashboard />} />
                    </Route>

                    {/* Operations */}
                    <Route element={<ProtectedRoute module="appointments" />}>
                      <Route path="appointments" element={<AppointmentsPage />} />
                    </Route>

                    <Route element={<ProtectedRoute module="repair_jobs" />}>
                      <Route path="repair-jobs" element={<RepairJobsPage />} />
                    </Route>

                    <Route element={<ProtectedRoute module="customers" />}>
                      <Route path="customers" element={<CustomersPage />} />
                    </Route>

                    <Route element={<ProtectedRoute module="vehicles" />}>
                      <Route path="vehicles" element={<VehiclesPage />} />
                    </Route>

                    {/* Workshop & Supply */}
                    <Route element={<ProtectedRoute module="inventory" />}>
                      <Route path="inventory" element={<InventoryPage />} />
                    </Route>

                    <Route element={<ProtectedRoute module="suppliers" />}>
                      <Route path="suppliers" element={<SuppliersPage />} />
                    </Route>

                    <Route element={<ProtectedRoute module="services" />}>
                      <Route path="services" element={<ServicesPage />} />
                    </Route>

                    <Route element={<ProtectedRoute module="mechanics" />}>
                      <Route path="mechanics" element={<MechanicsPage />} />
                    </Route>

                    {/* Management & Finance */}
                    <Route element={<ProtectedRoute module="invoices" />}>
                      <Route path="invoices" element={<InvoicesPage />} />
                    </Route>

                    <Route element={<ProtectedRoute module="employees" />}>
                      <Route path="employees" element={<EmployeesPage />} />
                    </Route>

                    <Route element={<ProtectedRoute module="reports" />}>
                      <Route path="reports" element={<ReportsPage />} />
                    </Route>

                    <Route element={<ProtectedRoute module="settings" />}>
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<RoleBasedHome />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
