import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { ROUTES } from "../constants/routes";

// ===== Auth (PUBLIC) =====
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import VerifyResetOtpPage from "../pages/auth/VerifyResetOtpPage"; // ✅ THÊM IMPORT
import NewPasswordPage from "../pages/auth/NewPasswordPage";
import VerifyCodePage from "../pages/auth/VerifyCodePage"; // (nếu dùng cho flow khác)

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

// ===== Guest =====
import ReceiveGuestRegistrationPage from "../pages/guest/ReceiveGuestRegistrationPage";

const isAuthed = () =>
  !!localStorage.getItem("sami:access") ||
  !!localStorage.getItem("accessToken");

const Private = ({ children }) =>
  isAuthed() ? children : <Navigate to={ROUTES.login} replace />;

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== Public ===== */}
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route
        path={ROUTES.verifyResetOtp}
        element={<VerifyResetOtpPage />}
      />{" "}
      {/* ✅ THÊM ROUTE */}
      <Route path={ROUTES.newPassword} element={<NewPasswordPage />} />
      <Route path={ROUTES.verifyCode} element={<VerifyCodePage />} />
      {/* ===== Private ===== */}
      <Route
        path={ROUTES.profile}
        element={
          <Private>
            <ProfilePage />
          </Private>
        }
      />
      <Route
        path={ROUTES.changePassword}
        element={
          <Private>
            <ChangePasswordPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.editProfile}
        element={
          <Private>
            <EditProfilePage />
          </Private>
        }
      />
      <Route
        path={ROUTES.tenants}
        element={
          <Private>
            <TenantListPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.tenantDetail}
        element={
          <Private>
            <TenantDetailPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.tenantEdit}
        element={
          <Private>
            <TenantEditPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.tenantCreate}
        element={
          <Private>
            <CreateTenantPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.contracts}
        element={
          <Private>
            <ContractListPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.contractDetail}
        element={
          <Private>
            <ContractDetailPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.contractAddendum}
        element={
          <Private>
            <ContractAddendumPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.createContract}
        element={
          <Private>
            <CreateContractPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.bills}
        element={
          <Private>
            <BillListPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.billDetail}
        element={
          <Private>
            <BillDetailPage />
          </Private>
        }
      />
      <Route
        path={ROUTES.receiveGuestRegistration}
        element={
          <Private>
            <ReceiveGuestRegistrationPage />
          </Private>
        }
      />
      {/* Fallback */}
      <Route path="/" element={<Navigate to={ROUTES.login} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  );
}
