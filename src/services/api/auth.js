// src/services/api/auth.js
import { http, unwrap } from "../http";

const PROFILE_PATHS = [
  "/auth/profile",
  "/auth/me",
  "/user/profile",
  "/user/me",
];
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

export async function login({ email, password, phone } = {}) {
  const payload = email
    ? { email: String(email).trim(), password }
    : { phone: String(phone || "").trim(), password };

  const res = await http.post("/auth/login", payload);
  const data = unwrap(res);

  // Lưu token để ProtectedRoute nhận ra đã đăng nhập
  const access =
    data?.accessToken ||
    data?.access_token ||
    data?.token ||
    data?.data?.accessToken;
  const refresh =
    data?.refreshToken || data?.refresh_token || data?.data?.refreshToken;

  if (access) {
    localStorage.setItem("sami:access", access);
    localStorage.setItem("accessToken", access);
  }
  if (refresh) {
    localStorage.setItem("sami:refresh", refresh);
    localStorage.setItem("refreshToken", refresh);
  }
  if (data?.user) {
    localStorage.setItem("sami:user", JSON.stringify(data.user));
  }

  return data;
}
export async function verifyOTP({ userId, otp }) {
  const res = await http.post("/auth/verify-otp", { userId, otp });
  const data = unwrap(res);
  persistSession(data);
  return data;
}

export async function getProfile() {
  let lastErr;
  for (const p of PROFILE_PATHS) {
    try {
      const res = await http.get(p);
      const raw = unwrap(res);
      return normalizeProfile(raw);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Không lấy được hồ sơ");
}

/** Chuẩn hoá dữ liệu hồ sơ về dạng phẳng để UI destructure */
function normalizeProfile(raw) {
  // Nếu backend trả HTML (bắt đầu bằng <!DOCTYPE hoặc <html>), bỏ qua
  if (
    typeof raw === "string" &&
    (raw.trim().startsWith("<!DOCTYPE") || raw.trim().startsWith("<html"))
  ) {
    console.warn("⚠️ Dữ liệu profile trả về HTML — bỏ qua cập nhật user");
    return JSON.parse(localStorage.getItem("sami:user")) || {};
  }

  // Nếu dữ liệu không có key user / id — cũng bỏ qua
  const u = raw?.data?.user ?? raw?.user ?? raw?.data ?? raw ?? {};
  if (!u || Object.keys(u).length === 0) {
    console.warn("⚠️ Profile rỗng — giữ nguyên user cũ");
    return JSON.parse(localStorage.getItem("sami:user")) || {};
  }

  // Trả về dữ liệu user đã chuẩn hóa
  return {
    id: u.user_id ?? u.id ?? u.uid ?? u._id ?? null,
    full_name: u.full_name ?? u.fullName ?? u.name ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    birthday: u.birthday ?? u.dob ?? "",
    gender: u.gender ?? u.sex ?? "",
    role: u.role ?? u.role_name ?? u.roleName ?? "",
    avatar_url: u.avatar_url ?? u.avatarUrl ?? "",
    _raw: u, // giữ lại nếu cần debug
  };
}

const UPDATE_PROFILE_PATHS = [["put", "/auth/profile"]];

const GENDER_TO_SERVER = {
  Nam: "Male",
  Nữ: "Female",
  Khác: "Other",
  male: "Male",
  female: "Female",
  other: "Other",
  Male: "Male",
  Female: "Female",
  Other: "Other",
};

function toISODate(v) {
  if (!v) return undefined;
  const s = String(v);
  const base = s.includes("T") ? s.split("T")[0] : s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(base)) return base;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return undefined;
}

export async function updateProfile(form = {}) {
  // Gửi đầy đủ các field cho phép chỉnh sửa trên hồ sơ
  const payload = {
    full_name: form.full_name ?? form.fullName,
    gender: GENDER_TO_SERVER[form.gender] ?? form.gender,
    birthday: toISODate(form.birthday),
    avatar_url: form.avatar_url,
    email: form.email, // ✅ THÊM EMAIL
    phone: form.phone, // ✅ THÊM SĐT
  };

  // Xoá key rỗng
  Object.keys(payload).forEach((k) => {
    if (payload[k] === "" || payload[k] === undefined) delete payload[k];
  });

  // Gọi đúng endpoint BE
  const [method, path] = UPDATE_PROFILE_PATHS[0]; // ["put", "/auth/profile"]
  const res = await http[method](path, payload);
  const raw = unwrap(res);

  const profile = normalizeProfile(raw);

  // Cập nhật lại localStorage để header / chỗ khác dùng user mới
  try {
    const oldUser = JSON.parse(localStorage.getItem("sami:user") || "{}");
    const merged = { ...oldUser, ...profile };
    localStorage.setItem("sami:user", JSON.stringify(merged));
  } catch (e) {
    console.warn("Không cập nhật được localStorage user:", e);
  }

  return profile;
}

const CHANGE_PW_PATHS = [
  ["post", "/auth/change-password"],
  ["put", "/auth/change-password"],
  ["post", "/auth/password"],
  ["put", "/user/change-password"],
];

export async function changePassword({ currentPassword, newPassword }) {
  let lastErr;
  for (const [method, path] of CHANGE_PW_PATHS) {
    try {
      const res = await http[method](path, {
        currentPassword,
        newPassword,
      });
      return unwrap(res);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Đổi mật khẩu thất bại");
}

export async function forgotPassword(email) {
  const res = await http.post("/auth/forgot-password", { email });
  return unwrap(res);
}

/** Verify OTP cho QUÊN MẬT KHẨU: cho phép truyền email HOẶC userId */
export async function verifyResetOTP({ userId, email, otp }) {
  const body = { otp };
  if (userId) body.userId = userId;
  if (email) body.email = email;
  const res = await http.post("/auth/verify-otp-forgot", body);
  return unwrap(res); // expect { userId, resetToken, message }
}

/** Resend OTP: chấp nhận email hoặc userId */
export async function resendResetOTP({ userId, email }) {
  const body = {};
  if (userId) body.userId = userId;
  if (email) body.email = email;
  const res = await http.post("/auth/resend-otp-forgot", body);
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
