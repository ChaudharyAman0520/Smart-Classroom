import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "teacher" | "student";
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader message="Authenticating session data..." fullPage />;
  }

  if (!user) {
    // Redirect unauthenticated requests back to the login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If user's role doesn't match the specific restriction, redirect them to their respective home dashboard
    const defaultDashboard =
      user.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard";
    return <Navigate to={defaultDashboard} replace />;
  }

  return <>{children}</>;
}
