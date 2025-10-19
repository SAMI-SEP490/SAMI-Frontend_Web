import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// AUTH
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import VerifyCodePage from "../pages/auth/VerifyCodePage";
import NewPasswordPage from "../pages/auth/NewPasswordPage";
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
import ContractListPage from "../pages/contract/ContractListPage";

//PROFILE
import ChangePasswordPage from "../pages/profile/ChangePasswordPage";
import EditProfilePage from "../pages/profile/EditProfilePage";

// Định nghĩa các route trong ứng dụng
import { ROUTES } from "../constants/routes";
import ContractDetailPage from "../pages/contract/ContractDetailPage";
import ContractAddendumPage from "../pages/contract/ContractAddendumPage";
import CreateContractPage from "../pages/contract/CreateContractPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Trang gốc → điều hướng vào 1 trang an toàn (vd: /profile hoặc /tenants) */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* PUBLIC */}
      <Route path={ROUTES.login} element={<LoginPage />} />

      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.verifyCode} element={<VerifyCodePage />} />
      <Route path={ROUTES.newPassword} element={<NewPasswordPage />} />

      {/* PROTECTED: bọc bằng ProtectedRoute */}
      <Route
        path={ROUTES.profile}
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.contracts}
        element={
          <ProtectedRoute>
            <ContractListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.contractDetail}
        element={
          <ProtectedRoute>
            <ContractDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.contractAddendum}
        element={
          <ProtectedRoute>
            <ContractAddendumPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.createContract}
        element={
          <ProtectedRoute>
            <CreateContractPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.tenants}
        element={
          <ProtectedRoute>
            <TenantListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.tenantDetail}
        element={
          <ProtectedRoute>
            <TenantDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.tenantEdit}
        element={
          <ProtectedRoute>
            <TenantEditPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.bills}
        element={
          <ProtectedRoute>
            <BillListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.billDetail}
        element={
          <ProtectedRoute>
            <BillDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.changePassword}
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.editProfile}
        element={
          <ProtectedRoute>
            <EditProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.profile} replace />} />
    </Routes>
  );
}
