// src/services/api/auth.js
import { http, unwrap } from "../http";

/** Lưu session về localStorage theo cả 2 dạng key để tránh lệch với chỗ khác */
function persistSession(payload) {
  if (!payload) return;

  // Back-end có thể trả các tên khác nhau, gom lại cho chắc
  const accessToken =
    payload.accessToken || payload.token || payload.access_token;
  const refreshToken = payload.refreshToken || payload.refresh_token;
  const user = payload.user;

  if (accessToken) {
    localStorage.setItem("sami:access", accessToken);
    localStorage.setItem("accessToken", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("sami:refresh", refreshToken);
    localStorage.setItem("refreshToken", refreshToken);
  }
  if (user) {
    localStorage.setItem("sami:user", JSON.stringify(user));
  }
}

export async function login({ email, password }) {
  const res = await http.post("/auth/login", { email, password });
  const data = unwrap(res);

  // Nếu back-end trả requiresOTP thì chưa lưu token
  if (!data?.requiresOTP) {
    persistSession(data);
  }
  // data có thể là {requiresOTP,...} hoặc {accessToken, refreshToken, user}
  return data;
}

export async function verifyOTP({ userId, otp }) {
  const res = await http.post("/auth/verify-otp", { userId, otp });
  const data = unwrap(res);
  persistSession(data);
  return data;
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

/** Verify OTP cho QUÊN MẬT KHẨU: trả (resetToken, userId) */
export async function verifyResetOTP({ userId, otp }) {
  const res = await http.post("/auth/verify-otp-forgot", { userId, otp });
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
  // Gửi refreshToken để server revoke, nhưng luôn dọn client dù API lỗi
  const refreshToken =
    localStorage.getItem("sami:refresh") ||
    localStorage.getItem("refreshToken");

  try {
    await http.post("/auth/logout", { refreshToken });
  } catch {
    // best-effort: nuốt lỗi để không chặn user đăng xuất
  } finally {
    [
      "sami:access",
      "accessToken",
      "sami:refresh",
      "refreshToken",
      "sami:user",
    ].forEach((k) => localStorage.removeItem(k));
  }
}
