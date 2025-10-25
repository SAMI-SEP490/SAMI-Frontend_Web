// src/routing/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token =
    localStorage.getItem("sami:access") || localStorage.getItem("accessToken");
  const location = useLocation();

  if (!token) {
    // Lưu “from” để sau đăng nhập quay lại
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return children;
}
