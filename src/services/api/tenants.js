// src/services/api/tenants.js
import { http } from "../http";

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
      (Array.isArray(d?.errors) && d.errors[0]?.message) ||
      "Không lấy được danh sách người dùng";
    throw new Error(msg);
  }

  const data = un(res);
  const arr = Array.isArray(data) ? data : [];
  // Giữ lại: role === 'TENANT' hoặc role == null; đồng thời loại user đã xóa mềm nếu có
  return arr.filter((u) => isTenantOrNullRole(u) && !u?.deleted_at);
}

/* ---------------- C) Lấy tenants theo phòng (TENANT | NULL) ---------------- */
export async function listTenantsByRoom(roomQuery) {
  // roomQuery có thể là roomId hoặc object { roomId | room_id | roomCode | room_number }
  const isObj = typeof roomQuery === "object" && roomQuery !== null;
  const roomId =
    (isObj && (roomQuery.roomId ?? roomQuery.room_id ?? roomQuery.room)) ||
    (!isObj && roomQuery) ||
    null;
  const roomCode = isObj ? roomQuery.roomCode ?? roomQuery.room_number : null;

  // 1) Gọi list-users (không truyền role) + filter ở FE
  try {
    const res = await http.get("/user/list-users", {
      params: {
        // KHÔNG truyền role để không mất user role=null
        room_id: roomId ?? undefined,
        room: roomCode ?? undefined,
      },
      validateStatus: () => true,
    });
    if (res?.status < 400) {
      const data = un(res);
      const arr = Array.isArray(data) ? data : [];
      return arr
        .filter((u) => isTenantOrNullRole(u))
        .filter((u) => {
          if (!roomId && !roomCode) return true;
          const rid =
            u?.room_id ?? u?.roomId ?? u?.room?.room_id ?? u?.room?.id;
          const rcode = u?.room?.room_number ?? u?.room_number ?? u?.room?.code;
          const okId = roomId ? String(rid) === String(roomId) : true;
          const okCode = roomCode
            ? String(rcode || "").toLowerCase() ===
              String(roomCode).toLowerCase()
            : true;
          return okId && okCode;
        });
    }
  } catch {
    /* ignore, sẽ fallback */
  }

  // 2) Fallback: lấy tất cả rồi lọc
  const all = await listTenants({ take: 500 });
  if (!roomId && !roomCode) return all;
  return all.filter((u) => {
    const rid = u?.room_id ?? u?.roomId ?? u?.room?.room_id ?? u?.room?.id;
    const rcode = u?.room?.room_number ?? u?.room_number ?? u?.room?.code;
    const okId = roomId ? String(rid) === String(roomId) : true;
    const okCode = roomCode
      ? String(rcode || "").toLowerCase() === String(roomCode).toLowerCase()
      : true;
    return okId && okCode;
  });
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
