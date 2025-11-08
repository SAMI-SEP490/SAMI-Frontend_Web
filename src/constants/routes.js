export const ROUTES = {
  profile: "/profile",
  login: "/login",

  // Auth
  forgotPassword: "/forgot-password",
  verifyResetOtp: "/verify-reset-otp", // ✅ THÊM DÒNG NÀY
  verifyCode: "/verify-code", // (nếu bạn dùng cho flow khác)
  newPassword: "/new-password",
  changePassword: "/change-password",
  editProfile: "/edit-profile",

  // Tenants
  tenants: "/tenants",
  tenantDetail: "/tenants/:id",
  tenantEdit: "/tenants/:id/edit",
  tenantCreate: "/tenants/create",

  // Contracts
  contracts: "/contracts",
  contractDetail: "/contracts/:id",
  contractAddendum: "/contracts/:id/addendum",
  contractCreate: "/contracts/create",

  // Bills
  bills: "/bills",
  billDetail: "/bills/:id",

  // Guests
  receiveGuestRegistration: "/receive-guest",

  // Notifications
  notifications: "/notifications",
  createNotification: "/notifications/create",
  editNotification: "/notifications/:id/edit",

  // maintaince
  maintainceRequests: "/maintaince-requests",

  // buildings
  buildings: "/buildings",
  editBuilding: "/buildings/:id/edit",

  // ===== Floor plan (mới) =====
  floorplanCreate: "/floorplan/create",
  floorplanView: "/floorplan/view",
};
