import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import VerifyCodePage from "../pages/auth/VerifyCodePage"; // OTP khi login 2FA
import ProfilePage from "../pages/profile/ProfilePage";
import ChangePasswordPage from "../pages/profile/ChangePasswordPage";
import ContractsListPage from "../pages/contract/ContractsListPage";
import CreateContractPage from "../pages/contract/CreateContractPage";
import ContractDetailPage from "../pages/contract/ContractDetailPage";

// NEW: trang nhập OTP cho quên mật khẩu (tạo ở bước 2)
import VerifyResetOtpPage from "../pages/auth/VerifyResetOtpPage";

const isAuthed = () =>
  !!localStorage.getItem("accessToken") ||
  !!localStorage.getItem("sami:access");

const Protected = ({ children }) =>
  isAuthed() ? children : <Navigate to="/login" replace />;

const HomeRedirect = () => (
  <Navigate to={isAuthed() ? "/profile" : "/login"} replace />
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-code" element={<VerifyCodePage />} />{" "}
      {/* login OTP */}
      <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />{" "}
      {/* forgot OTP */}
      <Route path="/new-password" element={<ChangePasswordPage />} />{" "}
      {/* bạn đang dùng UI này */}
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
        path="/contracts/new"
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
