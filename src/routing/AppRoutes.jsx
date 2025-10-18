import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import Header from "../components/Header";
import ProfilePage from "../pages/profile/ProfilePage";
import LoginPage from "../pages/auth/LoginPage";
import ContractListPage from "../pages/dashboard/ContractListPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.login} replace />} />

        <Route path={ROUTES.login} element={<LoginPage />} />

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

      <Route
        path={ROUTES.TENANT_DETAIL}
        element={
          <ProtectedRoute>
            <TenantDetailPage />
          </ProtectedRoute>
        }
      />
    </div>
  );
}
