// src/services/api/tenants.js
import { http } from "../http";

// unwrap: hỗ trợ các kiểu trả về phổ biến {data:{data}}, {data}, hoặc mảng
const un = (res) => res?.data?.data ?? res?.data ?? res;

/* =======================
 *  LIST TENANTS
 * ======================= */
// Thử nhiều endpoint để hợp backend hiện tại
const TENANT_LIST_ENDPOINTS = [
  { url: "/user/list-users", params: { role: "tenant", take: 200 } },
  { url: "/user", params: { role: "tenant", take: 200 } },
  { url: "/user/tenants", params: { take: 200 } },
  { url: "/tenants", params: {} },
];

export async function listTenants(params = {}) {
  let lastErr;
  for (const ep of TENANT_LIST_ENDPOINTS) {
    try {
      const res = await http.get(ep.url, {
        params: { ...ep.params, ...params },
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) {
        const raw = un(res);
        const arr = raw?.items ?? raw?.data ?? raw;
        return Array.isArray(arr) ? arr : [];
      }
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  return [];
}

/* =======================
 *  LIST TENANTS BY ROOM
 *  (chọn phòng -> lọc tenant)
 * ======================= */
export async function listTenantsByRoom(roomId) {
  if (!roomId) return [];
  // Ưu tiên nhờ BE filter; nếu không có thì FE tự filter
  try {
    // Thử gọi giống listTenants nhưng truyền room_id
    const res = await listTenants({ room_id: roomId, status: "active" });
    if (Array.isArray(res) && res.length) {
      return res.filter((t) => {
        const rid = t?.room_id ?? t?.roomId ?? t?.room?.id ?? t?.room?.room_id;
        return String(rid) === String(roomId);
      });
    }
  } catch {   
    return [];
  }
  // Fallback: lấy tất cả rồi lọc FE
  try {
    const all = await listTenants({ status: "active", take: 500 });
    return all.filter((t) => {
      const rid = t?.room_id ?? t?.roomId ?? t?.room?.id ?? t?.room?.room_id;
      return String(rid) === String(roomId);
    });
  } catch {
    return [];
  }
}

/* =======================
 *  REGISTER TENANT QUICK
 *  (đăng ký user -> change-to-tenant)
 * ======================= */
async function registerUser({
  email,
  password,
  phone,
  full_name,
  gender,
  birthday,
}) {
  const res = await http.post("/auth/register", {
    email,
    password,
    phone,
    full_name, // BE dùng full_name (snake)
    gender,
    birthday,
  });
  return un(res); // => { id, email, phone, full_name, ... }
}

async function changeToTenant({
  userId,
  idNumber,
  emergencyContactPhone,
  note,
}) {
  const res = await http.post("/user/change-to-tenant", {
    userId,
    idNumber,
    emergencyContactPhone,
    note,
  });
  return un(res);
}

export async function registerTenantQuick(form) {
  // 1) đăng ký user
  const reg = await registerUser({
    email: form.email,
    password: form.password,
    phone: form.phone,
    full_name: form.full_name,
    gender: form.gender,
    birthday: form.birthday,
  });
  const userId = reg?.id ?? reg?.user_id;
  if (!userId) throw new Error("Không lấy được userId sau khi đăng ký.");

  // 2) đổi sang tenant
  const tenant = await changeToTenant({
    userId,
    idNumber: form.idNumber,
    emergencyContactPhone: form.emergencyPhone,
    note: form.note || "",
  });

  return { userId, user: reg, tenant };
}
