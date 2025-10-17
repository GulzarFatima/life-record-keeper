import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/use-auth.js";

export default function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === "admin" ? <Outlet /> : <Navigate to="/login" replace />;
}
