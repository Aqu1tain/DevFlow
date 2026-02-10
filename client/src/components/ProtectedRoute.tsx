import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;

  if (!isAuthenticated)
    return <Navigate to="/login" replace />;

  return children;
}
