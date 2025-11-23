// src/services/api/regulation.js
import { http, unwrap } from "../http";

// ========================================
// 📌 CREATE - Tạo regulation
// ========================================
export async function createRegulation(payload) {
  const { data } = await http.post("/regulation/", payload);
  return unwrap(data);
}

// ========================================
// 📌 READ - Lấy danh sách regulations
// ========================================
export async function listRegulations(params = {}) {
  const { data } = await http.get("/regulation/", { params });
  return unwrap(data);
}

// Lấy regulation theo ID
export async function getRegulationById(id) {
  const { data } = await http.get(`/regulation/${id}`);
  return unwrap(data);
}

// Lấy regulations theo building
export async function getRegulationsByBuilding(buildingId, params = {}) {
  const { data } = await http.get(`/regulation/building/${buildingId}`, {
    params,
  });
  return unwrap(data);
}

// Lấy tất cả version của 1 regulation
export async function getRegulationVersions(title) {
  const { data } = await http.get(`/regulation/versions/${title}`);
  return unwrap(data);
}

// Lấy thống kê regulation
export async function getRegulationStatistics(buildingId = "") {
  const url = buildingId
    ? `/regulation/statistics/${buildingId}`
    : `/regulation/statistics/`;

  const { data } = await http.get(url);
  return unwrap(data);
}

// Lấy feedbacks của regulation
export async function getRegulationFeedbacks(id) {
  const { data } = await http.get(`/regulation/${id}/feedbacks`);
  return unwrap(data);
}

// ========================================
// 📌 UPDATE
// ========================================
export async function updateRegulation(id, payload) {
  const { data } = await http.put(`/regulation/${id}`, payload);
  return unwrap(data);
}

// Publish regulation
export async function publishRegulation(id) {
  const { data } = await http.post(`/regulation/${id}/publish`);
  return unwrap(data);
}

// Archive regulation
export async function unpublishRegulation(id) {
  const { data } = await http.post(`/regulation/${id}/unpublish`);
  return unwrap(data);
}

// Thêm feedback
export async function addRegulationFeedback(id, payload) {
  const { data } = await http.post(`/regulation/${id}/feedbacks`, payload);
  return unwrap(data);
}

// ========================================
// 📌 DELETE
// ========================================
export async function deleteRegulation(id) {
  const { data } = await http.delete(`/regulation/${id}`);
  return unwrap(data);
}
