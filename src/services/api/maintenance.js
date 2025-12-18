import { http, unwrap } from "../http";

export async function listMaintenance(params = {}) {
  const { data } = await http.get("/maintenance/", { params });
  return unwrap(data);
}

export async function listUser(params = {}) {
  const { data } = await http.get("/user/list-users", { params });
  return unwrap(data);
}

// ✅ Phê duyệt yêu cầu bảo trì
export async function approveMaintenanceRequest(id) {
  const { data } = await http.post(`/maintenance/${id}/approve`);
  return unwrap(data);
}

// ❌ Từ chối yêu cầu bảo trì
export async function rejectMaintenanceRequest(id, reason) {
  const { data } = await http.post(`/maintenance/${id}/reject`, { reason });
  return unwrap(data);
}
// 🛠️ Đánh dấu yêu cầu bảo trì đã giải quyết
export async function resolveMaintenanceRequest(id) {
  const { data } = await http.post(`/maintenance/${id}/resolve`);
  return unwrap(data);
}

// ✅ Đánh dấu yêu cầu bảo trì đã hoàn thành
export async function completeMaintenanceRequest(id) {
  const { data } = await http.post(`/maintenance/${id}/complete`);
  return unwrap(data);
}
