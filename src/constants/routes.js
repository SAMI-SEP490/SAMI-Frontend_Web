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
  createTenants: "/tenants/create", // (đang có cả 2 key giống path, giữ nguyên để tương thích)

  // Bills
  bills: "/bills",
  billDetail: "/bills/:id",

  // Contracts
  contracts: "/contracts",
  contractDetail: "/contracts/:id",
  contractAddendum: "/contracts/:id/addendum",
  createContract: "/contracts/create",

  // Guests
  receiveGuestRegistration: "/receive-guest",
};
