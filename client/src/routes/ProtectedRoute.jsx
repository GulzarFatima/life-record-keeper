import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/use-auth.js";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
}
