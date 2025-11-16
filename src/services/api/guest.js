// src/services/api/guest.js
import { http, unwrap } from "../http";

// ===============================
// 📌 Tenant APIs
// ===============================

// Tạo yêu cầu đăng ký khách
export async function createGuestRegistration(payload) {
  const { data } = await http.post("/guest/", payload);
  return unwrap(data);
}

// Cập nhật yêu cầu đăng ký khách
export async function updateGuestRegistration(id, payload) {
  const { data } = await http.put(`/guest/${id}`, payload);
  return unwrap(data);
}

// Xóa yêu cầu đăng ký khách
export async function deleteGuestRegistration(id) {
  const { data } = await http.delete(`/guest/${id}`);
  return unwrap(data);
}

// Hủy yêu cầu đăng ký khách (shared)
export async function cancelGuestRegistration(id, payload) {
  const { data } = await http.post(`/guest/${id}/cancel`, payload);
  return unwrap(data);
}

// ===============================
// 📌 Manager / Owner APIs
// ===============================

// Phê duyệt yêu cầu đăng ký khách
export async function approveGuestRegistration(id) {
  const { data } = await http.post(`/guest/${id}/approve`);
  return unwrap(data);
}

// Từ chối yêu cầu đăng ký khách
export async function rejectGuestRegistration(id, reason) {
  const { data } = await http.post(`/guest/${id}/reject`, { reason });
  return unwrap(data);
}

// ===============================
// 📌 Shared APIs
// ===============================

// Lấy danh sách guest registrations
export async function listGuestRegistrations(params = {}) {
  const { data } = await http.get("/guest/", { params });
  return unwrap(data);
}

// Lấy thống kê
export async function getGuestRegistrationStats(params = {}) {
  const { data } = await http.get("/guest/stats", { params });
  return unwrap(data);
}

// Lấy chi tiết theo ID
export async function getGuestRegistrationById(id) {
  const { data } = await http.get(`/guest/${id}`);
  return unwrap(data);
}
