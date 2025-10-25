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
    birthday: form.birthday, // yyyy-mm-dd (chuẩn ISO càng tốt)
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
