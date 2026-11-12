import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from '@/layouts/AppLayout'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { pageLoaders } from '@/lib/pageLoaders'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { LoadingSpinner } from '@/components/ui'

// Lazy-Loaded Page Modules
const LoginPage = lazy(pageLoaders.LoginPage)
const UnauthorizedPage = lazy(pageLoaders.UnauthorizedPage)
const AdminDashboard = lazy(pageLoaders.AdminDashboard)
const MechanicDashboard = lazy(pageLoaders.MechanicDashboard)
const AppointmentsPage = lazy(pageLoaders.AppointmentsPage)
const RepairJobsPage = lazy(pageLoaders.RepairJobsPage)
const CustomersPage = lazy(pageLoaders.CustomersPage)
const VehiclesPage = lazy(pageLoaders.VehiclesPage)
const InventoryPage = lazy(pageLoaders.InventoryPage)
const SuppliersPage = lazy(pageLoaders.SuppliersPage)
const ServicesPage = lazy(pageLoaders.ServicesPage)
const MechanicsPage = lazy(pageLoaders.MechanicsPage)
const InvoicesPage = lazy(pageLoaders.InvoicesPage)
const EmployeesPage = lazy(pageLoaders.EmployeesPage)
const ReportsPage = lazy(pageLoaders.ReportsPage)
const SettingsPage = lazy(pageLoaders.SettingsPage)
const AuditLogsPage = lazy(pageLoaders.AuditLogsPage)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Reuse data for 30s; mutations invalidate explicitly, focus/reconnect refetch stale data
      gcTime: 1000 * 60 * 10, // Retain data in garbage collector cache for 10m for instant UI transitions
      refetchOnWindowFocus: true, // Fetch fresh data automatically when user refocuses the window
      refetchOnReconnect: true,  // Fetch fresh data when network reconnects
      refetchOnMount: true,      // Fetch fresh data on component mount
      retry: (failureCount, error) => {
        if (error?.status === 401 || error?.status === 403) return false
        return failureCount < 1
      },
    },
  },
})

// Helper to determine the default landing page for each of the 6 RBAC roles
function RoleBasedHome() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
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

                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                      <Route path="audit-logs" element={<AuditLogsPage />} />
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
