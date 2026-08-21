import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import MechanicDashboard from './pages/mechanic/MechanicDashboard'
import AppointmentsPage from './pages/admin/AppointmentsPage'
import ServicesPage from './pages/admin/ServicesPage'
import MechanicsPage from './pages/admin/MechanicsPage'
import CustomersPage from './pages/CustomersPage'
import VehiclesPage from './pages/VehiclesPage'
import RepairJobsPage from './pages/RepairJobsPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Helper to determine the default home page based on role
function RoleBasedHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'mechanic') return <Navigate to="/mechanic/dashboard" replace />;
  return <Navigate to="/unauthorized" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected Routes (inside the app layout with sidebar) */}
              <Route path="/" element={<AppLayout />}>
                {/* Redirect root to the appropriate dashboard based on role */}
                <Route index element={<RoleBasedHome />} />

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="admin/dashboard" element={<AdminDashboard />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="vehicles" element={<VehiclesPage />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="mechanics" element={<MechanicsPage />} />
                </Route>

                {/* Mechanic Routes */}
                <Route element={<ProtectedRoute allowedRoles={['mechanic']} />}>
                  <Route path="mechanic/dashboard" element={<MechanicDashboard />} />
                </Route>

                {/* Shared Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'mechanic']} />}>
                  <Route path="repair-jobs" element={<RepairJobsPage />} />
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<RoleBasedHome />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
