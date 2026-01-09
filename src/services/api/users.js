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
  const res = await http.get("/user/list-users", { params });
  const data = unwrap(res);

  const arr = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return arr.filter((u) => u.role === "TENANT");
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
 *  Cho phép truyền cả roomId, idNumber, emergencyContactPhone, note...
 * ========================= */
export async function changeToTenant({ userId, idNumber, note }) {
  const res = await http.post("/user/change-to-tenant", {
    userId: Number(userId),
    idNumber,
    note: note || undefined,
  });
  return unwrap(res);
}
export async function assignTenantToRoom({
  tenantUserId,
  roomId,
  movedInAt,
  tenantType = "PRIMARY",
  note,
}) {
  const res = await http.post("/room-tenants/assign", {
    tenantUserId: Number(tenantUserId),
    roomId: Number(roomId),
    movedInAt: movedInAt
      ? new Date(movedInAt).toISOString()
      : new Date().toISOString(),
    tenantType,
    note,
  });

  return unwrap(res);
}
/** =========================
 *  REGISTER TENANT QUICK
 *  (gộp register user -> change-to-tenant)
 * ========================= */
export async function registerTenantQuick(form) {
  const user = await registerUser({
    email: form.email,
    password: form.password,
    phone: form.phone,
    full_name: form.full_name,
    gender: form.gender,
    birthday: form.birthday,
  });

  const userId = user.user_id || user.id;

  // Tạo TENANT
  await changeToTenant({
    userId,
    idNumber: form.idNumber,
    note: form.note || undefined,
  });

  // Gán phòng
  if (form.roomId) {
    await assignTenantToRoom({
      tenantUserId: userId,
      roomId: form.roomId,
      movedInAt: form.startDate,
    });
  }

  return userId;
}

/** =========================
 *  NEW: GET USER BY ID
 * ========================= */
const GET_USER_PATHS = [
  "/user/get-user/:id",
  "/user/:id",
  "/users/:id",
  "/tenant/:id",
  "/tenants/:id",
];
export async function getUserById(id) {
  for (const raw of GET_USER_PATHS) {
    const url = raw.replace(":id", id);
    try {
      // Cho phép nhận cả 4xx/5xx, tự xử lý status
      const res = await http.get(url, {
        validateStatus: () => true,
      });

      // Nếu gọi được và status < 400 thì coi là thành công
      if (res && res.status < 400) {
        const data = unwrap(res);
        return data?.data ?? data; // đồng nhất trả về object user
      }

      // Nếu status >= 400 thì thử path tiếp theo
      continue;
    } catch {
      // Lỗi network / parse... thì cũng thử path khác
      continue;
    }
  }

  // Nếu tất cả path đều fail ⇒ ném ra message chuẩn theo yêu cầu tester
  throw new Error("Không lấy được thông tin người dùng");
}

/** =========================
 *  NEW: UPDATE USER
 * ========================= */
export async function updateUser(id, form = {}) {
  const payload = {
    user_id: id,
    full_name: form.full_name,
    phone: String(form.phone ?? "").trim(),
    birthday: normalizeDate(form.birthday),
    gender: GENDER_MAP[form.gender] || form.gender,
  };

  // Xoá field rỗng
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined || payload[k] === "") {
      delete payload[k];
    }
  });
  console.log("UPDATE PAYLOAD:", payload);
  const res = await http.put(`/user/update/${id}`, payload);

  return unwrap(res);
}

// ✅ Đổi role
export const changeManagerToTenant = async (payload) => {
  return unwrap(http.post("/user/change-to-tenant", payload));
};

export const changeToManager = async ({
  userId,
  buildingId,
  note,
}) => {
  return unwrap(
    http.post("/user/change-to-manager", {
      userId: Number(userId),
      buildingId: Number(buildingId),
      note: note || undefined,
    })
  );
};
// 🧭 Lấy danh sách tất cả users (chỉ owner và manager được phép)
export const listUsers = async (params = {}) => {
  const res = await http.get("/user/list-users", {
    params, // ✅ CHÌA KHÓA
  });
  return unwrap(res);
};
export async function deleteUser(userId) {
  const res = await http.delete(`/user/delete/${userId}`);
  return unwrap(res);
}

// ♻️ Restore user
export async function restoreUser(userId) {
  const res = await http.post(`/user/restore/${userId}`);
  return unwrap(res);
}

// 🔍 Search users
export async function searchUsers(keyword) {
  const res = await http.get("/user/search", {
    params: { keyword },
  });
  return unwrap(res);
}
export const updateProfile = async ({
  full_name,
  birthday,
  gender,
  avatar,
  phone, // ✅ thêm phone
}) => {
  const formData = new FormData();

  if (full_name) formData.append("full_name", full_name.trim());

  if (birthday) formData.append("birthday", new Date(birthday).toISOString());

  if (gender)
    formData.append(
      "gender",
      gender === "Nam" ? "Male" : gender === "Nữ" ? "Female" : "Other"
    );

  if (phone) formData.append("phone", phone.trim()); // ✅ thêm dòng này

  if (avatar) {
    formData.append("avatar", avatar); // 👈 multer.single("avatar")
  }

  return unwrap(http.put("/auth/profile", formData));
};
