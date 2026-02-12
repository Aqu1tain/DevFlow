import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading)
    return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;

  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;

  if (user?.role === "admin" && !user.totpEnabled && location.pathname !== "/settings")
    return <Navigate to="/settings" replace />;

  return children;
}
