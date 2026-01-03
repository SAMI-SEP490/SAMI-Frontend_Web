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

  // Users
  users: "/users",
  userDetail: "/users/:id",
  userEdit: "/users/:id/edit",
  userCreate: "/users/create",
  // Contracts
  contracts: "/contracts",
  editContract: "/contracts/:id",
  contractAddendum: "/contracts/:id/addendum",
  createContract: "/contracts/create",

  // Bills
  bills: "/bills",
  billDetail: "/bills/:id",
  createBill: "/bills/create",
  editBill: "/bills/:id/edit",

  // Guests
  receiveGuestRegistration: "/receive-guest",

  // Notifications
  notifications: "/notifications",
  createNotification: "/notifications/create",

  //regulations
  regulations: "/regulations",
  editRegulation: "/regulations/:id/edit",
  createRegulation: "/regulations/create",
  viewRegulation: "/regulations/:id/",

  // maintaince
  maintainceRequests: "/maintaince-requests",

  // buildings
  buildings: "/buildings",
  editBuilding: "/buildings/:id/edit",
  createBuilding: "/buildings/create",
  viewBuilding: "/buildings/:id",

  // ===== Floor plan (mới) =====
  floorplanCreate: "/floorplan/create",
  floorplanView: "/floorplan/view",

  // Dashboard
  tenantAggregates: "/dashboard/tenant-aggregates",
  viewTimebaseReport: "/dashboard/timebase-report",

  //vehicle registrations
  vehicleRegistrations: "/vehicle-registrations",
  SlotListPage: "/parking-slots",
  CreateParkingSlotPage: "/parking-slots/create",
  // Rooms
  rooms: "/rooms",
  roomDetail: "/rooms/:id",
  roomEdit: "/rooms/:id/edit",
  roomCreate: "/rooms/create",
};
