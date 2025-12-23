import { http, unwrap } from "../http";

/* Danh sách building */
export const getBuildings = () =>
  http.get("/building").then(unwrap);
/** 🏢 CREATE - Tạo tòa nhà mới (owner) */
export async function createBuilding(payload) {
  if (!payload) throw new Error("payload is required");
  const { data } = await http.post("/building", payload);
  return unwrap(data);
}

/** 📋 READ - Lấy danh sách tòa nhà */
export async function listBuildings(params = {}) {
  const { data } = await http.get("/building", { params });
  return unwrap(data);
}
export async function listAssignedBuildings() {
  try {
    const res = await http.get("/building/manager/assigned");
    console.log("DEBUG API Response:", res); // <--- Thêm dòng này để xem nó in ra gì

    // Nếu res có cấu trúc { data: { data: [...] } } (Axios chuẩn)
    if (res.data && res.data.data) return res.data.data;

    // Nếu res có cấu trúc { data: [...] } (đã qua interceptor)
    if (res.data && Array.isArray(res.data)) return res.data;

    return [];
  } catch (error) {
    console.error("Lỗi:", error);
    throw error;
  }
}


/** 🔍 READ - Lấy thông tin tòa nhà theo ID */
export async function getBuildingById(buildingId) {
  if (!buildingId) throw new Error("buildingId is required");
  const { data } = await http.get(`/building/${buildingId}`);
  return unwrap(data);
}

/** 📊 READ - Lấy thống kê tòa nhà */
export async function getBuildingStatistics(buildingId) {
  if (!buildingId) throw new Error("buildingId is required");
  const { data } = await http.get(`/building/${buildingId}/statistics`);
  return unwrap(data);
}

/** ✏️ UPDATE - Cập nhật thông tin tòa nhà */
export async function updateBuilding(buildingId, payload) {
  if (!buildingId) throw new Error("buildingId is required");
  if (!payload) throw new Error("payload is required");

  const { data } = await http.put(`/building/${buildingId}`, payload);
  return unwrap(data);
}

/** 🚫 DEACTIVATE - Vô hiệu hóa tòa nhà */
export async function deactivateBuilding(buildingId) {
  if (!buildingId) throw new Error("buildingId is required");

  const { data } = await http.post(`/building/${buildingId}/deactivate`);
  return unwrap(data);
}

/** ✅ ACTIVATE - Kích hoạt lại tòa nhà */
export async function activateBuilding(buildingId) {
  if (!buildingId) throw new Error("buildingId is required");

  const { data } = await http.post(`/building/${buildingId}/activate`);
  return unwrap(data);
}

/** ❌ DELETE - Xóa vĩnh viễn tòa nhà */
export async function deleteBuilding(buildingId) {
  if (!buildingId) throw new Error("buildingId is required");

  const { data } = await http.delete(`/building/${buildingId}/permanent`);
  return unwrap(data);
}

/* ======================================================
   👤 BUILDING MANAGER APIs
====================================================== */

/** 👥 READ - Lấy danh sách managers của tòa nhà */
export async function getBuildingManagers(buildingId) {
  if (!buildingId) throw new Error("buildingId is required");

  const { data } = await http.get(`/building/${buildingId}/managers`);
  return unwrap(data);
}

/** ➕ CREATE - Gán manager cho tòa nhà */
export async function assignManager(buildingId, payload) {
  if (!buildingId) throw new Error("buildingId is required");
  if (!payload) throw new Error("payload is required");

  const { data } = await http.post(`/building/${buildingId}/managers`, payload);
  return unwrap(data);
}

/** 🔄 UPDATE - Cập nhật assignment của manager */
export const updateManagerAssignment = (buildingId, userId, payload) =>
  http.put(
    `/building/${buildingId}/managers/${userId}`,
    payload
  ).then(unwrap);

/** ❌ DELETE - Xóa manager khỏi tòa nhà */
export async function removeManager(buildingId, userId) {
  if (!buildingId) throw new Error("buildingId is required");
  if (!userId) throw new Error("userId is required");

  const { data } = await http.delete(
    `/building/${buildingId}/managers/${userId}`
  );
  return unwrap(data);
}
