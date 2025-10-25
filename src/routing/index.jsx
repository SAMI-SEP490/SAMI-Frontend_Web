import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import VerifyCodePage from "../pages/auth/VerifyCodePage";
import ProfilePage from "../pages/profile/ProfilePage";
import ChangePasswordPage from "../pages/profile/ChangePasswordPage";
import ContractsListPage from "../pages/contract/ContractsListPage";
import CreateContractPage from "../pages/contract/CreateContractPage";
import ContractDetailPage from "../pages/contract/ContractDetailPage";

// Tenants
import CreateTenantPage from "../pages/tenant/CreateTenantPage";
import TenantListPage from "../pages/tenant/TenantListPage";
import TenantDetailPage from "../pages/tenant/TenantDetailPage"; // <— NEW
import TenantEditPage from "../pages/tenant/TenantEditPage"; // <— NEW

// NEW: trang nhập OTP cho quên mật khẩu
import VerifyResetOtpPage from "../pages/auth/VerifyResetOtpPage";

const isAuthed = () =>
  !!localStorage.getItem("accessToken") ||
  !!localStorage.getItem("sami:access");

const Protected = ({ children }) =>
  isAuthed() ? children : <Navigate to="/login" replace />;

const HomeRedirect = () => (
  <Navigate to={isAuthed() ? "/contracts" : "/login"} replace />
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-code" element={<VerifyCodePage />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
      <Route path="/new-password" element={<ChangePasswordPage />} />

      {/* Private */}
      <Route
        path="/contracts"
        element={
          <Protected>
            <ContractsListPage />
          </Protected>
        }
      />
      <Route
        path="/contracts/create"
        element={
          <Protected>
            <CreateContractPage />
          </Protected>
        }
      />
      <Route
        path="/contracts/:id"
        element={
          <Protected>
            <ContractDetailPage />
          </Protected>
        }
      />

      {/* Tenants */}
      <Route
        path="/tenants"
        element={
          <Protected>
            <TenantListPage />
          </Protected>
        }
      />
      <Route
        path="/tenants/create"
        element={
          <Protected>
            <CreateTenantPage />
          </Protected>
        }
      />
      {/* NEW: Detail & Edit */}
      <Route
        path="/tenants/:id"
        element={
          <Protected>
            <TenantDetailPage />
          </Protected>
        }
      />
      <Route
        path="/tenants/:id/edit"
        element={
          <Protected>
            <TenantEditPage />
          </Protected>
        }
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <Protected>
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/change-password"
        element={
          <Protected>
            <ChangePasswordPage />
          </Protected>
        }
      />

      {/* Fallbacks */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
