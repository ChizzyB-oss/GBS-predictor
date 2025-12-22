import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function ProtectedRoute({ children, allowed }) {
  const { user, loading } = useAuth();

  // Wait until auth finishes loading stored session
  if (loading) return null; // Or a loader component

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Check allowed roles (array)
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
