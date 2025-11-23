// src/services/api/addendum.js
// Updated: 2025-24-10
// By: Datnb

import { http, unwrap } from "../http";

/** ============================
 *  ADDENDUM API SERVICE
 *  Tái sử dụng chuẩn theo style maintenance
 * ============================ */

/** ✔ Lấy danh sách phụ lục */
export async function listAddendums(params = {}) {
  const { data } = await http.get("/addendum/", { params });
  return unwrap(data);
}

/** ✔ Lấy thống kê phụ lục */
export async function getAddendumStatistics() {
  const { data } = await http.get("/addendum/statistics");
  return unwrap(data);
}

/** ✔ Lấy phụ lục theo ID */
export async function getAddendumById(id) {
  const { data } = await http.get(`/addendum/${id}`);
  return unwrap(data);
}

/** ✔ Lấy tất cả phụ lục của 1 hợp đồng */
export async function getAddendumsByContract(contractId) {
  const { data } = await http.get(`/addendum/contract/${contractId}`);
  return unwrap(data);
}

/** ✔ Tạo phụ lục hợp đồng mới */
export async function createAddendum(payload) {
  const { data } = await http.post("/addendum/", payload);
  return unwrap(data);
}

/** ✔ Cập nhật phụ lục */
export async function updateAddendum(id, payload) {
  const { data } = await http.put(`/addendum/${id}`, payload);
  return unwrap(data);
}

/** ✔ Xóa phụ lục */
export async function deleteAddendum(id) {
  const { data } = await http.delete(`/addendum/${id}`);
  return unwrap(data);
}
