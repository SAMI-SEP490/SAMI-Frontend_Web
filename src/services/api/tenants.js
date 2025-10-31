// src/services/api/tenants.js
import { http, unwrap } from "../http";

/** BE của bạn mount /api/user (singular). Lấy DS tenant — thử vài path phổ biến để tránh 404. */
export async function listTenants(params = {}) {
  const CANDIDATES = ["/user", "/user/tenants"];
  let lastErr;
  for (const p of CANDIDATES) {
    try {
      const res = await http.get(p, { params: { role: "tenant", ...params } });
      return unwrap(res);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** Bước 1: Đăng ký user mới */
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
    full_name,
    gender,
    birthday,
  });
  const data = unwrap(res); // { id, email, phone, full_name, status }
  return data;
}

/** Bước 2: Chuyển user vừa tạo thành TENANT (yêu cầu role owner/manager) */
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
  return unwrap(res);
}

/** API “đăng ký tenant nhanh”: gộp 2 bước ở trên */
export async function registerTenantQuick(form) {
  // map từ form UI → payload backend
  const reg = await registerUser({
    email: form.email,
    password: form.password,
    phone: form.phone,
    full_name: form.full_name, // chú ý: BE dùng full_name (snake)
    gender: form.gender, // "male"/"female"...
    birthday: form.birthday, // yyyy-mm-dd
  });

  const userId = reg?.id; // auth.register() trả về 'id' = user_id
  if (!userId) throw new Error("Không lấy được userId sau khi đăng ký.");

  const tenantRes = await changeToTenant({
    userId,
    idNumber: form.idNumber, // CMND/CCCD
    emergencyContactPhone: form.emergencyPhone, // SĐT người thân/liên hệ khẩn
    note: form.note || "",
  });

  return { userId, user: reg, tenant: tenantRes };
}

/* ===========================
 *  BỔ SUNG CHO CREATE CONTRACT
 * =========================== */

/** Thử nhiều endpoint phòng để tương thích nhiều BE khác nhau */
const ROOM_ENDPOINTS = [
  { url: "/room/list", params: { status: "active", take: 200 } },
  { url: "/room", params: { status: "active" } },
  { url: "/rooms", params: { status: "active" } },
];

function normalizeRoom(r) {
  const id = r?.room_id ?? r?.id ?? r?.roomId ?? r?.room?.id;
  const label =
    r?.room_number ??
    r?.number ??
    r?.name ??
    r?.room?.room_number ??
    (id != null ? `Phòng ${id}` : "Phòng");
  const floor = r?.floor ?? r?.level ?? r?.room?.floor ?? null;
  return id == null ? null : { id, label, floor };
}

/** Lấy danh sách phòng rút gọn cho dropdown */
export async function listRoomsLite() {
  for (const ep of ROOM_ENDPOINTS) {
    try {
      const res = await http.get(ep.url, {
        params: ep.params,
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) {
        const raw = unwrap(res);
        const arr = raw?.items ?? raw?.data ?? raw;
        const items = (Array.isArray(arr) ? arr : [])
          .map(normalizeRoom)
          .filter(Boolean);
        if (items.length) return items;
      }
    } catch {
      /* thử endpoint tiếp theo */
    }
  }
  return [];
}

function normalizeTenant(t) {
  const id = t?.tenant_user_id ?? t?.user_id ?? t?.id ?? t?.tenant?.id;
  const name =
    (t?.full_name && t.full_name.trim()) ||
    [t?.first_name, t?.last_name].filter(Boolean).join(" ").trim() ||
    t?.tenant?.full_name ||
    "Người thuê";

  const roomId = t?.room_id ?? t?.roomId ?? t?.room?.id ?? null;
  const phone = t?.phone ?? t?.phone_number ?? t?.mobile ?? null;
  return id == null ? null : { id, name, roomId, phone };
}

/** Lấy tenants theo phòng; nếu BE chưa filter, FE sẽ filter sau */
export async function listTenantsByRoom(roomId) {
  // cố gắng nhờ BE filter trước
  try {
    const res = await listTenants({
      room_id: roomId,
      status: "active",
      take: 200,
    });
    const arr = res?.items ?? res?.data ?? res;
    let items = (Array.isArray(arr) ? arr : [])
      .map(normalizeTenant)
      .filter(Boolean);
    if (!items.length) {
      // fallback: lấy tất cả tenant rồi tự filter
      const resAll = await listTenants({ status: "active", take: 500 });
      const arrAll = resAll?.items ?? resAll?.data ?? resAll;
      items = (Array.isArray(arrAll) ? arrAll : [])
        .map(normalizeTenant)
        .filter(Boolean)
        .filter((x) => String(x.roomId) === String(roomId));
    }
    return items;
  } catch {
    return [];
  }
}
