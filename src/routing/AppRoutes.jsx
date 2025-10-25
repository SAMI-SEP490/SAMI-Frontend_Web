// src/routing/AppRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { ROUTES } from "../constants/routes";

// ===== Auth (Public) =====
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import VerifyResetOtpPage from "../pages/auth/VerifyResetOtpPage";
import NewPasswordPage from "../pages/auth/NewPasswordPage";
import VerifyCodePage from "../pages/auth/VerifyCodePage";

// ===== Profile =====
import ProfilePage from "../pages/profile/ProfilePage";
import ChangePasswordPage from "../pages/profile/ChangePasswordPage";
import EditProfilePage from "../pages/profile/EditProfilePage";

// ===== Tenants =====
import TenantListPage from "../pages/tenant/TenantListPage";
import TenantDetailPage from "../pages/tenant/TenantDetailPage";
import TenantEditPage from "../pages/tenant/TenantEditPage";
import CreateTenantPage from "../pages/tenant/CreateTenantPage";

// ===== Contracts =====
import ContractListPage from "../pages/contract/ContractListPage";
import ContractDetailPage from "../pages/contract/ContractDetailPage";
import ContractAddendumPage from "../pages/contract/ContractAddendumPage";
import CreateContractPage from "../pages/contract/CreateContractPage";

// ===== Bills =====
import BillListPage from "../pages/bill/BillListPage";
import BillDetailPage from "../pages/bill/BillDetailPage";

// ===== Guests =====
import ReceiveGuestRegistrationPage from "../pages/guest/ReceiveGuestRegistrationPage";

const isAuthed = () =>
  !!localStorage.getItem("sami:access") ||
  !!localStorage.getItem("accessToken");

// Fallback thông minh
const HomeRedirect = () => (
  <Navigate to={isAuthed() ? ROUTES.contracts : ROUTES.login} replace />
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== Public ===== */}
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.verifyResetOtp} element={<VerifyResetOtpPage />} />
      <Route path={ROUTES.newPassword} element={<NewPasswordPage />} />
      <Route path={ROUTES.verifyCode} element={<VerifyCodePage />} />

      {/* ===== Private (bọc ProtectedRoute) ===== */}
      <Route
        path={ROUTES.profile}
        element={
          <ProtectedRoute>
            <ProfilePage />
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
        path={ROUTES.tenantCreate}
        element={
          <ProtectedRoute>
            <CreateTenantPage />
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
        path={ROUTES.receiveGuestRegistration}
        element={
          <ProtectedRoute>
            <ReceiveGuestRegistrationPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
