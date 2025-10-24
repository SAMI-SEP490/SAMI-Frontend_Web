// src/services/api/users.js
import { http, unwrap } from "../http";

/**
 * Lấy danh sách người dùng là "Người thuê trọ".
 * Backend thường có: GET /users?role=tenant  (bạn chỉnh lại nếu BE khác).
 */
export async function listTenants(query = {}) {
  const res = await http.get("/users", {
    params: { role: "tenant", ...query },
  });
  return unwrap(res);
}
