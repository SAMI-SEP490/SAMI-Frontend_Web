// src/services/api/auth.js
import { http, unwrap } from "../http";

export async function login({ email, password }) {
  const res = await http.post("/auth/login", { email, password });
  const payload = unwrap(res);
  if (payload?.accessToken) {
    localStorage.setItem("sami:access", payload.accessToken);
    localStorage.setItem("sami:refresh", payload.refreshToken);
    localStorage.setItem("sami:user", JSON.stringify(payload.user));
  }
  return payload; // {requiresOTP,...} hoặc {accessToken, refreshToken, user}
}

export async function verifyOTP({ userId, otp }) {
  const res = await http.post("/auth/verify-otp", { userId, otp });
  const payload = unwrap(res);
  localStorage.setItem("sami:access", payload.accessToken);
  localStorage.setItem("sami:refresh", payload.refreshToken);
  localStorage.setItem("sami:user", JSON.stringify(payload.user));
  return payload;
}

export async function getProfile() {
  const res = await http.get("/auth/profile");
  return unwrap(res);
}

export async function updateProfile(body) {
  const res = await http.put("/auth/profile", body);
  return unwrap(res);
}

export async function changePassword({ currentPassword, newPassword }) {
  const res = await http.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return unwrap(res);
}

export async function forgotPassword(email) {
  const res = await http.post("/auth/forgot-password", { email });
  return unwrap(res);
}

export async function verifyResetOTP({ userId, otp }) {
  const res = await http.post("/auth/verify-otp-forgot", { userId, otp });
  // controller trả { success, message, resetToken, userId }
  return unwrap(res);
}

export async function resendResetOTP(userId) {
  const res = await http.post("/auth/resend-otp-forgot", { userId });
  return unwrap(res);
}

export async function resetPassword({ userId, resetToken, newPassword }) {
  const res = await http.post("/auth/reset-password", {
    userId,
    resetToken,
    newPassword,
  });
  return unwrap(res);
}


export async function logout() {
  // Gọi API chỉ "best effort" — nếu lỗi (offline/endpoint không có) thì nuốt lỗi.
  await http.post("/auth/logout").catch(() => null);

  // Luôn xoá token phía client
  localStorage.removeItem("sami:access");
  localStorage.removeItem("sami:refresh");
  localStorage.removeItem("sami:user");
}
