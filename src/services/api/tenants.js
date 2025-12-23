// src/services/api/tenants.js
import { http, unwrap } from "../http";

// unwrap các kiểu response {data:{data}} | {data} | data
const un = (res) => res?.data?.data ?? res?.data ?? res;

/* ---------------- Helpers ---------------- */
function toISODate(v) {
  if (!v) return undefined;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes("T")) return s.split("T")[0];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

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

const isTenantOrNullRole = (u) => {
  const r = u?.role;
  if (r === undefined || r === null || r === "") return true; // role null -> tính là tenant
  return String(r).toUpperCase() === "TENANT";
};

/* ---------------- A) Đăng ký user (KHÔNG truyền role) ---------------- */
export async function registerUser({
  email,
  password,
  phone,
  full_name,
  gender,
  birthday,
}) {
  const payload = {
    email: String(email || "").trim(),
    password,
    phone: String(phone || "").trim(),
    full_name: String(full_name || "").trim(), // snake_case
    fullName: String(full_name || "").trim(), // camelCase (đề phòng BE dùng key khác)
    gender: GENDER_TO_SERVER[gender] ?? gender,
    birthday: toISODate(birthday),
  };

  const res = await http.post("/auth/register", payload, {
    validateStatus: () => true,
  });

  if (!res || res.status >= 400) {
    const d = res?.data;
    const msg =
      d?.message ||
      d?.error ||
      (Array.isArray(d?.errors) && d.errors[0]?.message) ||
      "Validation error";
    throw new Error(msg);
  }
  return un(res);
}

/* ---------------- B) Lấy DS user và lọc TENANT | NULL ---------------- */
export async function listTenants(params = {}) {
  // Không gửi role lên BE để không bỏ sót user có role=null
  const res = await http.get("/user/list-users", {
    params, // ví dụ { take: 500 }
    validateStatus: () => true,
  });

  if (!res || res.status >= 400) {
    const d = res?.data;
    const msg =
      d?.message ||
      d?.error ||
      (Array.isArray(d?.errors) && d?.errors[0]?.message) ||
      "Không lấy được danh sách người dùng";
    throw new Error(msg);
  }

  const data = un(res);
  const arr = Array.isArray(data) ? data : [];
  // Giữ lại: role === 'TENANT' hoặc role == null; đồng thời loại user đã xóa mềm nếu có
  return arr.filter((u) => isTenantOrNullRole(u) && !u?.deleted_at);
}

/**
 * Dùng cho CREATE CONTRACT:
 * GET /tenant/room/:roomId -> chỉ tenant CHƯA có contract
 */
export async function getTenantsByRoomId(roomId, params = {}) {
  try {
    const response = await http.get(`/tenant/room/${roomId}`, { params });
    return un(response);
  } catch (error) {
    console.error(
      `Lỗi khi lấy danh sách tenant (lọc chưa có HĐ) của room ${roomId}:`,
      error
    );
    throw error;
  }
}

/**
 * ✅ Dùng cho CREATE BILL:
 * GET /tenant/moor/:roomId -> lấy TẤT CẢ tenant trong phòng
 * (Backend route đã có: /moor/:roomId) :contentReference[oaicite:4]{index=4}
 */
export async function getAllTenantsByRoomId(roomId, params = {}) {
  try {
    const response = await http.get(`/tenant/moor/${roomId}`, { params });
    return un(response);
  } catch (error) {
    console.error(`Lỗi khi lấy TẤT CẢ tenant của room ${roomId}:`, error);
    throw error;
  }
}

/* ---------------- D) Lấy chi tiết user ---------------- */
export async function getUserById(userId) {
  const res = await http.get(`/user/get-user/${userId}`, {
    validateStatus: () => true,
  });
  if (!res || res.status >= 400) {
    const d = res?.data;
    const msg = d?.message || d?.error || "Không lấy được thông tin người dùng";
    throw new Error(msg);
  }
  return un(res);
}

// Lấy tất cả tenants (KHÔNG phân trang)
export async function getAllTenants() {
  const res = await http.get("/tenant/all", {
    validateStatus: () => true,
  });

  if (!res || res.status >= 400) {
    const d = res?.data;
    const msg = d?.message || d?.error || "Không lấy được danh sách người thuê";
    throw new Error(msg);
  }

  const data = res?.data?.data ?? res?.data ?? res;
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function deleteTenantByUserId(userId) {
  if (!userId) {
    throw new Error("Thiếu ID người thuê.");
  }

  const res = await http.delete(`/user/delete/${userId}`, {
    validateStatus: () => true,
  });

  if (!res) {
    throw new Error("Không kết nối được tới máy chủ.");
  }

  if (res.status >= 400) {
    const d = res.data;
    const msg =
      d?.message || d?.error || "Không thể xóa người thuê. Vui lòng thử lại.";
    throw new Error(msg);
  }

  return un(res);
}
