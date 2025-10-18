import React from "react";
import { Navigate, useLocation } from "react-router-dom";

// Tạm thời cho qua để test; khi có auth thực, sửa lại điều kiện.
export default function ProtectedRoute({ children }) {
  const isAuthenticated = true; // hoặc !!localStorage.getItem('accessToken')
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
