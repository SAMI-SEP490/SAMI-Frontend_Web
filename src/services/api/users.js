// src/services/api/users.js
import { http, unwrap } from "../http";

/** =========================
 *  LIST TENANTS (GET)
 *  Backend mount: /api/user  (singular)
 *  ========================= */
const TENANTS_PATHS = [
  "/user", // đúng với BE của bạn: GET /api/user?role=tenant
  "/user/tenants", // fallback phổ biến
  "/tenants", // fallback
  "/tenant", // fallback
  "/users?role=tenant", // fallback (bản cũ)
];

const LIST_USERS_PATH = "/user/list-users";

const TENANTS_FALLBACK_PATHS = [
  "/user?role=tenant",
  "/users?role=tenant",
  "/users/tenants",
  "/tenants",
  "/tenant",
];

export async function listTenants(params = {}) {
  // 1) Gọi đúng route: /api/user/list-users
  try {
    const res = await http.get(LIST_USERS_PATH, { params });
    const raw = unwrap(res);

    // raw có thể là mảng hoặc object { data: [...] } hoặc { users: [...] }
    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.users)
      ? raw.users
      : [];

    // Chỉ lấy role = tenant (nhiều backend đặt khác key/lowercase)
    return arr.filter(
      (u) => String(u?.role ?? u?.role_name ?? "").toLowerCase() === "tenant"
    );
  } catch (e) {
    // 2) Fallback cho các codebase cũ
    let lastErr = e;
    for (const p of TENANTS_FALLBACK_PATHS) {
      try {
        const res = await http.get(p, { params });
        const data = unwrap(res);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        if (list.length) {
          return list.filter(
            (u) =>
              String(u?.role ?? u?.role_name ?? "").toLowerCase() === "tenant"
          );
        }
      } catch (er) {
        lastErr = er;
      }
    }
    throw lastErr;
  }
}

/** =========================
 *  Helpers chuẩn hóa dữ liệu
 * ========================= */
const GENDER_MAP = {
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
const digits = (v) => String(v ?? "").replace(/\D/g, "");
function normalizeDate(d) {
  if (!d) return undefined;
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // yyyy-mm-dd
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return s;
}

/** =========================
 *  REGISTER USER (POST /auth/register)
 * ========================= */
export async function registerUser({
  email,
  password,
  phone,
  full_name,
  gender, // "Male" | "Female" | "Other" | undefined
  birthday, // yyyy-mm-dd
}) {
  const res = await http.post("/auth/register", {
    email,
    password,
    phone,
    full_name,
    gender,
    birthday,
  });
  const data = unwrap(res);
  const user = data?.user ?? data?.data?.user ?? data;
  return user;
}

/** =========================
 *  CHANGE TO TENANT (POST /user/change-to-tenant)
 * ========================= */
export async function changeToTenant({
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

/** =========================
 *  REGISTER TENANT QUICK
 *  (gộp register user -> change-to-tenant)
 * ========================= */
export async function registerTenantQuick(form) {
  const email = String(form.email || "").trim();
  const password = form.password;
  const full_name = form.full_name || form.name || "";
  const phoneDigits = digits(form.phone);
  const gender = GENDER_MAP[form.gender] || undefined;
  const birthday = normalizeDate(form.birthday || form.dob);

  if (phoneDigits.length < 10) {
    throw new Error("Số điện thoại phải có ít nhất 10 chữ số.");
    // Hoặc xử lý theo yêu cầu UI của bạn
  }

  const userRes = await registerUser({
    email,
    password,
    phone: phoneDigits,
    full_name,
    gender,
    birthday,
  });

  const userId =
    userRes?.id ||
    userRes?.user_id ||
    userRes?.uid ||
    userRes?._id ||
    userRes?.data?.id;
  if (!userId) {
    console.error("Register response (unexpected shape):", userRes);
    throw new Error("Không lấy được userId sau khi đăng ký.");
  }

  const idNumber =
    digits(form.idNumber) || digits(Date.now()).slice(-12) || "000000000000";
  const emergencyContactPhone = digits(form.emergencyPhone || form.phone).slice(
    0,
    11
  );

  const tenantRes = await changeToTenant({
    userId,
    idNumber,
    emergencyContactPhone,
    note:
      [
        form.address && `Địa chỉ: ${form.address}`,
        form.floor && `Tầng: ${form.floor}`,
        form.room && `Phòng: ${form.room}`,
        form.startDate && `Từ: ${form.startDate}`,
        form.endDate && `Đến: ${form.endDate}`,
        form.contract && `Hợp đồng: ${form.contract}`,
        form.note && `${form.note}`,
      ]
        .filter(Boolean)
        .join(" | ") || "",
  });

  return { userId, user: userRes, tenant: tenantRes };
}

/** =========================
 *  NEW: GET USER BY ID
 *  Thử các path phổ biến, ưu tiên đúng BE: /api/user/get-user/:id
 * ========================= */
const GET_USER_PATHS = [
  "/user/get-user/:id",
  "/user/:id",
  "/users/:id",
  "/tenant/:id",
  "/tenants/:id",
];
export async function getUserById(id) {
  let lastErr;
  for (const raw of GET_USER_PATHS) {
    const url = raw.replace(":id", id);
    try {
      const res = await http.get(url);
      const data = unwrap(res);
      return data?.data ?? data; // đồng nhất trả về object user
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** =========================
 *  NEW: UPDATE USER
 *  PUT /api/user/update/:id (BE đang mount theo dạng này)
 *  - Gửi cả camelCase & snake_case để tương thích nhiều middleware
 * ========================= */
const UPDATE_USER_PATHS = ["/user/update/:id", "/users/:id"];
export async function updateUser(id, form = {}) {
  const payload = {
    // camelCase
    fullName: form.full_name ?? form.fullName,
    phone: String(form.phone ?? "").trim(),
    email: form.email,
    birthday: normalizeDate(form.birthday),
    gender: GENDER_MAP[form.gender] || form.gender,
    // snake_case song song
    full_name: form.full_name ?? form.fullName,
    // nếu BE ignore snake/camel thì vẫn nhận 1 trong 2
  };

  // Xoá field rỗng/undefined
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined || payload[k] === "") delete payload[k];
  });

  let lastErr;
  for (const raw of UPDATE_USER_PATHS) {
    const url = raw.replace(":id", id);
    try {
      const res = await http.put(url, payload);
      const data = unwrap(res);
      return data?.data ?? data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
