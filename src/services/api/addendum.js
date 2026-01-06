// src/services/api/addendum.js
// Updated: 2026-01-05
// By: Assistant (Based on Datnb's backend)

import { http, unwrap } from "../http";

/* ==========================================================================
// helpers
   ========================================================================== */

/**
 * Format ngày về YYYY-MM-DD để gửi lên backend
 * (Copy từ contracts.js để đảm bảo đồng bộ)
 */
function _toISODate(d) {
  if (!d) return null; // Backend service chấp nhận null
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Xử lý dữ liệu trước khi tạo/update phụ lục
 */
function _buildAddendumPayload(form) {
  const payload = { ...form };

  // Xử lý ngày hiệu lực
  if (form.effective_from) {
    payload.effective_from = _toISODate(form.effective_from);
  }

  if (form.effective_to) {
    payload.effective_to = _toISODate(form.effective_to);
  }

  // Đảm bảo changes là object (Backend service có thể handle string JSON,
  // nhưng gửi object trực tiếp để axios tự stringify là an toàn nhất)
  if (typeof form.changes === 'string') {
    try {
      payload.changes = JSON.parse(form.changes);
    } catch (e) {
      // Nếu không parse được thì giữ nguyên, để backend validate
    }
  }

  return payload;
}

/* ==========================================================================
// ADDENDUM API
   ========================================================================== */

/** * Lấy danh sách phụ lục (có filter & pagination)
 * Route: GET /
 */
export async function listAddendums(params = {}) {
  try {
    const response = await http.get("/addendum", { params });
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phụ lục:", error);
    // Trả về cấu trúc mặc định để tránh crash UI
    return { data: [], pagination: {} };
  }
}

/** * Lấy phụ lục theo ID
 * Route: GET /:id
 */
export async function getAddendumById(id) {
  try {
    const response = await http.get(`/addendum/${id}`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi lấy phụ lục ${id}:`, error);
    throw error;
  }
}

/** * Lấy tất cả phụ lục của 1 hợp đồng
 * Route: GET /contract/:contract_id
 */
export async function getAddendumsByContract(contractId) {
  try {
    const response = await http.get(`/addendum/contract/${contractId}`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi lấy phụ lục của hợp đồng ${contractId}:`, error);
    throw error;
  }
}

/** * Tạo phụ lục hợp đồng mới
 * Route: POST /
 */
export async function createAddendum(addendumData) {
  try {
    const payload = _buildAddendumPayload(addendumData);
    const response = await http.post("/addendum", payload);
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi tạo phụ lục:", error);
    throw error;
  }
}

/** * Cập nhật phụ lục
 * Route: PUT /:id
 */
export async function updateAddendum(id, addendumData) {
  try {
    const payload = _buildAddendumPayload(addendumData);
    const response = await http.put(`/addendum/${id}`, payload);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi cập nhật phụ lục ${id}:`, error);
    throw error;
  }
}

/** * Xóa phụ lục
 * Route: DELETE /:id
 */
export async function deleteAddendum(id) {
  try {
    const response = await http.delete(`/addendum/${id}`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi xóa phụ lục ${id}:`, error);
    throw error;
  }
}

/** * Duyệt phụ lục (Apply changes to contract)
 * Route: POST /:id/approve
 */
export async function approveAddendum(id) {
  try {
    const response = await http.post(`/addendum/${id}/approve`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi duyệt phụ lục ${id}:`, error);
    throw error;
  }
}

/** * Từ chối phụ lục
 * Route: POST /:id/reject
 * @param {string} reason - Lý do từ chối
 */
export async function rejectAddendum(id, reason = "") {
  try {
    const response = await http.post(`/addendum/${id}/reject`, { reason });
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi từ chối phụ lục ${id}:`, error);
    throw error;
  }
}

/** * Lấy thống kê phụ lục
 * Route: GET /statistics
 */
export async function getAddendumStatistics(contractId = null) {
  try {
    const params = contractId ? { contract_id: contractId } : {};
    const response = await http.get("/addendum/statistics", { params });
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê phụ lục:", error);
    throw error;
  }
}