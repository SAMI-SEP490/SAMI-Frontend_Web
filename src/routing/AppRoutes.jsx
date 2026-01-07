// src/routing/AppRoutes.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import ProtectedRoute from "./ProtectedRoute";

// layouts
import PrivateLayout from "../layouts/PrivateLayout";
import PublicLayout from "../layouts/PublicLayout";

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

// ===== Users =====
import UserListPage from "../pages/user/UserListPage";
import UserDetailPage from "../pages/user/UserDetailPage";
import UserEditPage from "../pages/user/UserEditPage";
import CreateUserPage from "../pages/user/CreateUserPage";

// ===== Contracts =====
import ContractListPage from "../pages/contract/ContractListPage";
//import ContractAddendumPage from "../pages/contract/AddendumListPage.jsx";
//import CreateAddendumPage from "../pages/contract/CreateAddendumPage.jsx";
//import EditAddendumPage from "../pages/contract/EditAddendumPage.jsx";
import CreateContractPage from "../pages/contract/CreateContractPage";
import EditContractPage from "../pages/contract/EditContractPage";

// ===== Bills =====
import BillListPage from "../pages/bill/BillListPage";
import BillDetailPage from "../pages/bill/BillDetailPage";
import CreateBillPage from "../pages/bill/CreateBillPage";
import EditBillPage from "../pages/bill/EditBillPage";

// ===== Guests =====
import ReceiveGuestRegistrationPage from "../pages/guest/ReceiveGuestRegistrationPage";

// ===== Notifications =====
import NotificationListPage from "../pages/notification/NotificationListPage";
import CreateNotificationPage from "../pages/notification/CreateNotificationPage";

// ===== Maintenance =====
import MaintenanceListPage from "../pages/maintenance/MaintenanceListPage";

// ===== Buildings =====
import BuildingListPage from "../pages/building/BuildingListPage";
import EditBuildingPage from "../pages/building/EditBuildingPage";
import CreateBuildingPage from "../pages/building/CreateBuildingPage";
import ViewBuildingDetail from "../pages/building/ViewBuildingDetail";

// ===== Floorplan (lazy) =====
const CreateFloorPlan = lazy(() =>
  import("@/pages/floorplan/CreateFloorPlan.jsx")
);
const ViewFloorPlan = lazy(() => import("@/pages/floorplan/ViewFloorPlan.jsx"));
const EditFloorPlan = lazy(() => import("@/pages/floorplan/EditFloorPlan.jsx"));
// ===== Dashboard =====
import TenantAggregatesPage from "../pages/dashboard/TenantAggregatesPage";
import ViewTimeBasedReportsPage from "../pages/dashboard/ViewTimeBasedReportsPage";

// regulations
import RegulationListPage from "../pages/regulation/RegulationListPage";
import CreateRegulationPage from "../pages/regulation/CreateRegulationPage";
import EditRegulationPage from "../pages/regulation/EditRegulationPage";

// vehicle registrations
import VehicleRegistrationListPage from "../pages/vehicle/VehicleRegistrationListPage";
import VehicleManagementPage from "../pages/vehicle/VehicleManagementPage";
import ViewRegulationPage from "../pages/regulation/ViewRegulationPage";

// parking slots
import SlotListPage from "../pages/parkingslot/SlotListPage";
import CreateParkingSlotPage from "../pages/parkingslot/CreateParkingSlotPage";
// rooms
import RoomListPage from "@/pages/room/RoomListPage.jsx";

// ===== Utility Services =====
import UtilityServicePage from "@/pages/services/UtilityServicePage.jsx";

const isAuthed = () =>
  !!localStorage.getItem("sami:access") ||
  !!localStorage.getItem("accessToken");

const HomeRedirect = () => (
  <Navigate
    to={isAuthed() ? ROUTES.viewTimebaseReport : ROUTES.login}
    replace
  />
);

const LazyFallback = <div style={{ padding: 16 }}>Loading…</div>;

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== Public ===== */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.verifyResetOtp} element={<VerifyResetOtpPage />} />
        <Route path={ROUTES.newPassword} element={<NewPasswordPage />} />
        <Route path={ROUTES.verifyCode} element={<VerifyCodePage />} />
      </Route>
      {/* ===== Private ===== */}
      <Route element={<PrivateLayout />}>
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

        {/* Contracts */}
        <Route
          path={ROUTES.contracts}
          element={
            <ProtectedRoute>
              <ContractListPage />
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
        {/*  <Route*/}
        {/*  path={ROUTES.contractAddendum}*/}
        {/*  element={*/}
        {/*    <ProtectedRoute>*/}
        {/*      <ContractAddendumPage/>*/}
        {/*    </ProtectedRoute>*/}
        {/*  }*/}
        {/*/>*/}
        {/*  <Route*/}
        {/*      path={ROUTES.createAddendum}*/}
        {/*      element={*/}
        {/*          <ProtectedRoute>*/}
        {/*              <CreateAddendumPage />*/}
        {/*          </ProtectedRoute>*/}
        {/*      }*/}
        {/*  />*/}
        {/*  <Route*/}
        {/*      path={ROUTES.editAddendum}*/}
        {/*      element={*/}
        {/*          <ProtectedRoute>*/}
        {/*              <EditAddendumPage />*/}
        {/*          </ProtectedRoute>*/}
        {/*      }*/}
        {/*  />*/}
        <Route
          path={ROUTES.editContract}
          element={
            <ProtectedRoute>
              <EditContractPage />
            </ProtectedRoute>
          }
        />
        {/* Tenants */}
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
              <CreateTenantPage/>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.users}
          element={
            <ProtectedRoute>
              <UserListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.userDetail}
          element={
            <ProtectedRoute>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.userEdit}
          element={
            <ProtectedRoute>
              <UserEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.userCreate}
          element={
            <ProtectedRoute>
              <CreateUserPage />
            </ProtectedRoute>
          }
        />
        {/* Bills */}
        <Route
          path={ROUTES.bills}
          element={
            <ProtectedRoute>
              <BillListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.editBill}
          element={
            <ProtectedRoute>
              <EditBillPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.createBill}
          element={
            <ProtectedRoute>
              <CreateBillPage />
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

        {/* Guests */}
        <Route
          path={ROUTES.receiveGuestRegistration}
          element={
            <ProtectedRoute>
              <ReceiveGuestRegistrationPage />
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path={ROUTES.notifications}
          element={
            <ProtectedRoute>
              <NotificationListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.createNotification}
          element={
            <ProtectedRoute>
              <CreateNotificationPage />
            </ProtectedRoute>
          }
        />

        {/* regulation  */}
        <Route
          path={ROUTES.regulations}
          element={
            <ProtectedRoute>
              <RegulationListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.createRegulation}
          element={
            <ProtectedRoute>
              <CreateRegulationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.editRegulation}
          element={
            <ProtectedRoute>
              <EditRegulationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.viewRegulation}
          element={
            <ProtectedRoute>
              <ViewRegulationPage />
            </ProtectedRoute>
          }
        />

        {/* Maintenance */}
        <Route
          path={ROUTES.maintainceRequests}
          element={
            <ProtectedRoute>
              <MaintenanceListPage />
            </ProtectedRoute>
          }
        />

        {/* Buildings */}
        <Route
          path={ROUTES.buildings}
          element={
            <ProtectedRoute>
              <BuildingListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.editBuilding}
          element={
            <ProtectedRoute>
              <EditBuildingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.createBuilding}
          element={
            <ProtectedRoute>
              <CreateBuildingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.viewBuilding}
          element={
            <ProtectedRoute>
              <ViewBuildingDetail />
            </ProtectedRoute>
          }
        />

        {/* vehicle registrations*/}
        <Route
          path={ROUTES.vehicleRegistrations}
          element={
            <ProtectedRoute>
              <VehicleRegistrationListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.VehicleManagementPage}
          element={
            <ProtectedRoute>
              <VehicleManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SlotListPage}
          element={
            <ProtectedRoute>
              <SlotListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CreateParkingSlotPage}
          element={
            <ProtectedRoute>
              <CreateParkingSlotPage />
            </ProtectedRoute>
          }
        />
        {/* Floorplan (lazy with Suspense) */}
        <Route
          path={ROUTES.floorplanCreate}
          element={
            <ProtectedRoute>
              <Suspense fallback={LazyFallback}>
                <CreateFloorPlan />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.floorplanView}
          element={
            <ProtectedRoute>
              <Suspense fallback={LazyFallback}>
                <ViewFloorPlan />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/floorplan/edit/:planId"
          element={
            <ProtectedRoute>
              <Suspense fallback={LazyFallback}>
                <EditFloorPlan />
              </Suspense>
            </ProtectedRoute>
          }
        />
        {/* Dashboard */}
        <Route
          path={ROUTES.tenantAggregates}
          element={
            <ProtectedRoute>
              <TenantAggregatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.viewTimebaseReport}
          element={
            <ProtectedRoute>
              <ViewTimeBasedReportsPage />
            </ProtectedRoute>
          }
        />
        {/* roon */}
        <Route
          path={ROUTES.rooms}
          element={
            <ProtectedRoute>
              <RoomListPage />
            </ProtectedRoute>
          }
        />
        {/* ===== Utility Services ===== */}
        <Route
          path={ROUTES.utilityServices}
          element={
            <ProtectedRoute>
              <UtilityServicePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
