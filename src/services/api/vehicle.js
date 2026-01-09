// src/services/api/vehicle.js
import { http } from "../http";

/* =============================
 * VEHICLE REGISTRATIONS
 * ============================= */

/**
 * Lấy danh sách đăng ký xe
 * Filters: status, requested_by, start_date_from, start_date_to, page, limit
 */
export async function listVehicleRegistrations(params = {}) {
  const res = await http.get("/vehicle/registrations", { params });
  return res?.data?.data ?? res?.data ?? [];
}

/**
 * Lấy chi tiết đăng ký xe
 */
export async function getVehicleRegistrationById(id) {
  const res = await http.get(`/vehicle/registrations/${id}`);
  return res?.data?.data ?? null;
}

/**
 * Tạo đăng ký xe (TENANT)
 */
export async function createVehicleRegistration(payload) {
  const res = await http.post("/vehicle/registrations", payload);
  return res?.data?.data ?? null;
}

/**
 * Cập nhật đăng ký xe (TENANT – chỉ khi REQUESTED)
 */
export async function updateVehicleRegistration(id, payload) {
  const res = await http.put(`/vehicle/registrations/${id}`, payload);
  return res?.data?.data ?? null;
}

/**
 * Xóa đăng ký xe
 */
export async function deleteVehicleRegistration(id) {
  const res = await http.delete(`/vehicle/registrations/${id}`);
  return res?.data?.data ?? null;
}

/**
 * Approve đăng ký xe + gán slot (MANAGER / OWNER)
 * ⚠️ BẮT BUỘC slot_id
 */
export async function approveVehicleRegistration(id, slot_id) {
  const res = await http.post(`/vehicle/registrations/${id}/approve`, {
    slot_id,
  });
  return res?.data?.data ?? null;
}

/**
 * Reject đăng ký xe
 */
export async function rejectVehicleRegistration(id, payload) {
  const res = await http.post(
    `/vehicle/registrations/${id}/reject`,
    payload
  );
  return res?.data?.data ?? null;
}

/**
 * Cancel đăng ký xe
 */
export async function cancelVehicleRegistration(id, payload) {
  const res = await http.post(
    `/vehicle/registrations/${id}/cancel`,
    payload
  );
  return res?.data?.data ?? null;
}

/**
 * Thống kê đăng ký xe
 */
export async function getVehicleRegistrationStats() {
  const res = await http.get("/vehicle/registrations/stats");
  return res?.data?.data ?? {};
}

/* =============================
 * VEHICLES (QUẢN LÝ PHƯƠNG TIỆN)
 * ============================= */

/**
 * Lấy danh sách xe
 * Filters: status, type, tenant_user_id, license_plate, page, limit
 */
export async function listVehicles(params = {}) {
  const res = await http.get("/vehicle", { params });
  return res?.data?.data?.vehicles ?? [];
}

/**
 * Lấy chi tiết xe
 */
export async function getVehicleById(id) {
  const res = await http.get(`/vehicle/${id}`);
  return res?.data?.data ?? null;
}

/**
 * Deactivate xe (tự nhả slot)
 */
export async function deactivateVehicle(id, payload = {}) {
  const res = await http.post(`/vehicle/${id}/deactivate`, payload);
  return res?.data?.data ?? null;
}

/**
 * Reactivate xe (BẮT BUỘC gán slot)
 */
export async function reactivateVehicle(id, slot_id) {
  const res = await http.post(`/vehicle/${id}/reactivate`, {
    slot_id,
  });
  return res?.data?.data ?? null;
}

/**
 * Đổi slot cho xe
 */
export async function changeVehicleSlot(vehicleId, slotId) {
  return http.post(`/vehicle/${vehicleId}/change-slot`, {
    slot_id: slotId
  });
}

/**
 * Gán slot cho xe (fallback / admin)
 */
export async function assignVehicleToSlot(id, slot_id) {
  const res = await http.post(`/vehicle/${id}/assign-slot`, {
    slot_id,
  });
  return res?.data?.data ?? null;
}
