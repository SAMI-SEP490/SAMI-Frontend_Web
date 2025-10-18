import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// AUTH
import LoginPage from "../pages/auth/LoginPage";

// PROFILE (đổi đường dẫn đúng với project bạn)
import ProfilePage from "../pages/profile/ProfilePage";

// TENANT
import TenantListPage from "../pages/tenant/TenantListPage";
import TenantDetailPage from "../pages/tenant/TenantDetailPage";
import TenantEditPage from "../pages/tenant/TenantEditPage";

// BILL
import BillListPage from "../pages/bill/BillListPage";
import BillDetailPage from "../pages/bill/BillDetailPage";

// CONTRACT (nếu có)
import ContractListPage from "../pages/dashboard/ContractListPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Trang gốc → điều hướng vào 1 trang an toàn (vd: /profile hoặc /tenants) */}
      <Route path="/" element={<Navigate to="/profile" replace />} />

      {/* PUBLIC */}
      <Route path="/login" element={<LoginPage />} />

      {/* PROTECTED: bọc bằng ProtectedRoute */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contracts"
        element={
          <ProtectedRoute>
            <ContractListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tenants"
        element={
          <ProtectedRoute>
            <TenantListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants/:id"
        element={
          <ProtectedRoute>
            <TenantDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants/:id/edit"
        element={
          <ProtectedRoute>
            <TenantEditPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bills"
        element={
          <ProtectedRoute>
            <BillListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bills/:id"
        element={
          <ProtectedRoute>
            <BillDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/profile" replace />} />
    </Routes>
  );
}
