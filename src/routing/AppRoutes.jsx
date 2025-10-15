import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import Header from "../components/Header";
import HomePage from "../pages/home/HomePage";
import ProfilePage from "../pages/profile/ProfilePage";

export default function AppRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </>
  );
}
