// src/services/api/addendum.js
// Updated: 2026-01-07
// By: Assistant (Refactored to match addendum.routes.js with File Upload)

import { http, unwrap } from "../http";

/* ==========================================================================
// HELPERS
   ========================================================================== */

/**
 * Format ngày về YYYY-MM-DD
 */
function _toISODate(d) {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Chuyển object dữ liệu thành FormData để gửi Multipart (hỗ trợ upload file)
 * @param {Object} form - Dữ liệu form đầu vào
 * @returns {FormData}
 */
function _buildFormData(form) {
  const formData = new FormData();

  Object.keys(form).forEach((key) => {
    const value = form[key];

    // Bỏ qua nếu value là null/undefined
    if (value === null || value === undefined) return;

    // 1. Xử lý File Upload
    // Backend đang mong đợi key là 'addendum_file'
    // Frontend có thể truyền vào mảng file qua key 'files' hoặc 'addendum_file'
    if (key === 'files' || key === 'addendum_file') {
      if (Array.isArray(value)) {
        value.forEach((file) => {
          formData.append('addendum_file', file);
        });
      } else if (value instanceof File) {
        formData.append('addendum_file', value);
      }
      return; // Đã xử lý xong key này
    }

    // 2. Xử lý Object 'changes' (cần stringify để gửi qua form-data)
    if (key === 'changes' && typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }

    // 3. Xử lý Date (effective_from, effective_to, signing_date, etc.)
    if (['effective_from', 'effective_to', 'signing_date'].includes(key)) {
      const dateStr = _toISODate(value);
      if (dateStr) formData.append(key, dateStr);
      return;
    }

    // 4. Các trường dữ liệu thông thường
    formData.append(key, value);
  });

  return formData;
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

/** * Tạo phụ lục hợp đồng mới (Có upload file)
 * Route: POST /
 * @param {Object} addendumData - Object chứa thông tin và mảng 'files'
 */
export async function createAddendum(addendumData) {
  try {
    // Chuyển sang FormData để upload file
    const formData = _buildFormData(addendumData);

    // Axios tự động set Content-Type: multipart/form-data khi nhận FormData
    const response = await http.post("/addendum", formData);
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi tạo phụ lục:", error);
    throw error;
  }
}

/** * Cập nhật phụ lục (Có thể thay đổi file)
 * Route: PUT /:id
 */
export async function updateAddendum(id, addendumData) {
  try {
    const formData = _buildFormData(addendumData);
    const response = await http.put(`/addendum/${id}`, formData);
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

/** * Duyệt phụ lục (Tenant)
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

/** * Từ chối phụ lục (Tenant)
 * Route: POST /:id/reject
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

/** * Lấy URL download (Presigned URL)
 * Route: GET /:id/download
 */
export async function downloadAddendum(id) {
  try {
    const response = await http.get(`/addendum/${id}/download`);
    return unwrap(response); // Thường trả về { downloadUrl: "..." }
  } catch (error) {
    console.error(`Lỗi khi lấy link download phụ lục ${id}:`, error);
    throw error;
  }
}

/** * Download file trực tiếp (Stream/Blob)
 * Route: GET /:id/download/direct
 */
export async function downloadAddendumDirect(id) {
  try {
    // Cần set responseType là blob để nhận file binary
    const response = await http.get(`/addendum/${id}/download/direct`, {
      responseType: 'blob'
    });
    return response.data; // Trả về Blob object trực tiếp
  } catch (error) {
    console.error(`Lỗi khi download trực tiếp phụ lục ${id}:`, error);
    throw error;
  }
}