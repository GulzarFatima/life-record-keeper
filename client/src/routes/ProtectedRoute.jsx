import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/use-auth.js";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify" replace />;
  return <Outlet />;
}
