// src/services/api/vehicle.js
import { http } from "../http";

/** -----------------------------
 * VEHICLE REGISTRATIONS
 * ----------------------------- */

/**
 * Lấy danh sách đăng ký xe
 * Có thể truyền filter params: status, tenantId, page, limit...
 */
export async function listVehicleRegistrations(params = {}) {
  try {
    const res = await http.get("/vehicle/registrations", { params });
    return res?.data?.data ?? res?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đăng ký xe:", error);
    throw error;
  }
}

/**
 * Lấy chi tiết đăng ký xe theo ID
 */
export async function getVehicleRegistrationById(id) {
  try {
    const res = await http.get(`/vehicle/registrations/${id}`);
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error(`Lỗi khi lấy đăng ký xe id=${id}:`, error);
    throw error;
  }
}

/**
 * Tạo đăng ký xe mới
 */
export async function createVehicleRegistration(payload) {
  try {
    const res = await http.post("/vehicle/registrations", payload);
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error("Lỗi khi tạo đăng ký xe:", error);
    throw error;
  }
}

/**
 * Cập nhật đăng ký xe theo ID
 */
export async function updateVehicleRegistration(id, payload) {
  try {
    const res = await http.put(`/vehicle/registrations/${id}`, payload);
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error(`Lỗi khi cập nhật đăng ký xe id=${id}:`, error);
    throw error;
  }
}

/**
 * Xóa đăng ký xe theo ID
 */
export async function deleteVehicleRegistration(id) {
  try {
    const res = await http.delete(`/vehicle/registrations/${id}`);
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error(`Lỗi khi xóa đăng ký xe id=${id}:`, error);
    throw error;
  }
}

/**
 * Duyệt đăng ký xe (MANAGER/OWNER)
 */
export async function approveVehicleRegistration(id) {
  try {
    const res = await http.post(`/vehicle/registrations/${id}/approve`);
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error(`Lỗi khi duyệt đăng ký xe id=${id}:`, error);
    throw error;
  }
}

/**
 * Từ chối đăng ký xe (MANAGER/OWNER)
 */
export async function rejectVehicleRegistration(id) {
  try {
    const res = await http.post(`/vehicle/registrations/${id}/reject`);
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error(`Lỗi khi từ chối đăng ký xe id=${id}:`, error);
    throw error;
  }
}

/**
 * Hủy đăng ký xe
 */
export async function cancelVehicleRegistration(id, payload) {
  try {
    const res = await http.post(`/vehicle/registrations/${id}/cancel`, payload);
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error(`Lỗi khi hủy đăng ký xe id=${id}:`, error);
    throw error;
  }
}

/**
 * Thống kê đăng ký xe
 */
export async function getVehicleRegistrationStats() {
  try {
    const res = await http.get("/vehicle/registrations/stats");
    return res?.data?.data ?? res?.data ?? {};
  } catch (error) {
    console.error("Lỗi khi lấy thống kê đăng ký xe:", error);
    throw error;
  }
}

/** -----------------------------
 * VEHICLES
 * ----------------------------- */

/**
 * Lấy danh sách xe
 */
export async function listVehicles() {
  try {
    const res = await http.get("/vehicle");
    return res?.data?.data ?? res?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách xe:", error);
    throw error;
  }
}

/**
 * Lấy chi tiết xe theo ID
 */
export async function getVehicleById(id) {
  try {
    const res = await http.get(`/vehicle/${id}`);
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error(`Lỗi khi lấy xe id=${id}:`, error);
    throw error;
  }
}
