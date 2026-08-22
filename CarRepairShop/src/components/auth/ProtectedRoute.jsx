import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  // If user is not logged in, redirect to login (if we had one)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is in the allowedRoles array
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authorized, render the child routes
  return <Outlet />;
}
