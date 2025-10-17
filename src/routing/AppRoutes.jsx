import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import Header from "../components/Header";
import ProfilePage from "../pages/profile/ProfilePage";
import LoginPage from "../pages/auth/LoginPage";
import ContractListPage from "../pages/dashboard/ContractListPage";
import ProtectedRoute from "./ProtectedRoute";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import VerifyCodePage from "../pages/auth/VerifyCodePage";
import NewPasswordPage from "../pages/auth/NewPasswordPage";


export default function AppRoutes() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.login} replace />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.verifyCode} element={<VerifyCodePage />} />
        <Route path={ROUTES.newPassword} element={<NewPasswordPage />} />


        {/* Các trang yêu cầu đăng nhập */}
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
      </Routes>
    </div>
  );
}
