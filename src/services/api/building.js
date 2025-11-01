import { http, unwrap } from "../http";

/** 🏢 Lấy danh sách tòa nhà */
export async function listBuildings(params = {}) {
  const { data } = await http.get("/building/", { params });
  return unwrap(data);
}

/** 👤 Lấy danh sách managers của một tòa nhà */
export async function getBuildingManagers(buildingId) {
  if (!buildingId) throw new Error("buildingId is required");
  const { data } = await http.get(`/building/${buildingId}/managers`);
  return unwrap(data);
}

/** ✏️ Cập nhật thông tin tòa nhà */
export async function updateBuilding(buildingId, payload) {
  if (!buildingId) throw new Error("buildingId is required");
  const { data } = await http.put(`/building/${buildingId}`, payload);
  return unwrap(data);
}
/** 🔄 Thay đổi trạng thái tòa nhà (active / inactive) */
export async function toggleBuildingStatus(buildingId, isActive) {
  if (!buildingId) throw new Error("buildingId is required");
  const { data } = await http.put(`/building/${buildingId}`, {
    is_active: isActive,
  });
  return unwrap(data);
}
/** ❌ Xóa vĩnh viễn tòa nhà */
export async function deleteBuilding(buildingId) {
  if (!buildingId) throw new Error("buildingId is required");
  const { data } = await http.delete(`/building/${buildingId}/permanent`);
  return unwrap(data);
}

/** ❌ Xóa manager khỏi tòa nhà */
export async function removeManager(buildingId, userId) {
  if (!buildingId) throw new Error("buildingId is required");
  if (!userId) throw new Error("userId is required");

  const { data } = await http.delete(
    `/building/${buildingId}/managers/${userId}`
  );
  return unwrap(data);
}
