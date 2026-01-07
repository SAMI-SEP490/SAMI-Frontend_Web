// src/services/api/parking-slots.js
import { http, unwrap } from "../http";

/* ==========================================================================
// PARKING SLOTS
   ========================================================================== */

/** Danh sách slot theo building */
export async function listParkingSlots(params = {}) {
  try {
    const res = await http.get("/parking-slots", { params });
    const data = unwrap(res);

    // backend: { success, data: { slots: [] } }
    return data?.slots || [];
  } catch (err) {
    console.error("Lỗi khi lấy parking slots", err);
    return [];
  }
}

/** Danh sách building cho trang parking */
export async function listBuildingsForParking() {
  try {
    const res = await http.get("/parking-slots/buildings");
    const data = unwrap(res);

    // backend: { success, data: [] }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Lỗi khi lấy building cho parking", err);
    return [];
  }
}

/** Chi tiết 1 slot */
export async function getParkingSlotById(id) {
  try {
    const res = await http.get(`/parking-slots/${id}`);
    const data = unwrap(res);

    // backend: { success, data: { slot } }
    return data?.slot;
  } catch (err) {
    console.error("Lỗi khi lấy parking slot", err);
    throw err;
  }
}

/** Tạo slot */
export async function createParkingSlot(data) {
  try {
    const res = await http.post("/parking-slots", data);
    const result = unwrap(res);

    return result?.slot;
  } catch (err) {
    console.error("Lỗi khi tạo parking slot", err);
    throw err;
  }
}

/** Update slot */
export async function updateParkingSlot(id, data) {
  try {
    const res = await http.put(`/parking-slots/${id}`, data);
    const result = unwrap(res);

    return result?.slot;
  } catch (err) {
    console.error("Lỗi khi update parking slot", err);
    throw err;
  }
}

/** Xoá slot */
export async function deleteParkingSlot(id) {
  try {
    const res = await http.delete(`/parking-slots/${id}`);
    return unwrap(res);
  } catch (err) {
    console.error("Lỗi khi xoá parking slot", err);
    throw err;
  }
}

/** Chỉ lấy slot còn trống */
export async function listAvailableParkingSlots(params = {}) {
  try {
    const res = await http.get("/parking-slots/available", { params });
    const data = unwrap(res);

    // backend: { success, data: { slots: [] } }
    return data?.slots || [];
  } catch (err) {
    console.error("Lỗi khi lấy available slots", err);
    return [];
  }
}
export async function listAvailableSlotsForVehicle(vehicleId) {
  try {
    const res = await http.get("/parking-slots/available-for-vehicle", {
      params: { vehicle_id: vehicleId }
    });

    const data = unwrap(res);
    // backend: { success, data: { slots: [] } }
    return data?.slots || [];
  } catch (err) {
    console.error("Lỗi khi lấy available slots for vehicle", err);
    return [];
  }
}