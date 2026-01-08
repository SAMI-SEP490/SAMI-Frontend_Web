// src/services/api/contracts.js
import { http, unwrap } from "../http";

const FILE_FIELD = "contract_file";

/* ==========================================================================
// HELPERS
   ========================================================================== */

function _toISODate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function _buildContractFormData(form) {
  if (form instanceof FormData) {
    return form;
  }

  const fd = new FormData();

  // 1. Mapping IDs
  if (form.room_id || form.roomId) fd.append("room_id", form.room_id || form.roomId);
  if (form.tenant_user_id || form.tenantUserId) fd.append("tenant_user_id", form.tenant_user_id || form.tenantUserId);
  if (form.building_id || form.buildingId) fd.append("building_id", form.building_id || form.buildingId);

  // 2. Dates
  const startDate = form.start_date || form.startDate;
  if (startDate) fd.append("start_date", _toISODate(startDate));

  const endDate = form.end_date || form.endDate;
  if (endDate) fd.append("end_date", _toISODate(endDate));

  // 3. Money
  const rentAmount = (form.rent_amount !== undefined && form.rent_amount !== "") ? form.rent_amount : form.rentAmount;
  if (rentAmount !== undefined && rentAmount !== "") fd.append("rent_amount", rentAmount);

  const depositAmount = (form.deposit_amount !== undefined && form.deposit_amount !== "") ? form.deposit_amount : form.depositAmount;
  if (depositAmount !== undefined && depositAmount !== "") fd.append("deposit_amount", depositAmount);

  // Penalty & Cycle
  if (form.penalty_rate !== undefined) fd.append("penalty_rate", form.penalty_rate);
  if (form.payment_cycle_months !== undefined) fd.append("payment_cycle_months", form.payment_cycle_months);

  // 4. Common
  if (form.status) fd.append("status", form.status);
  const note = form.note !== undefined ? form.note : "";
  if (note !== undefined) fd.append("note", note);

  // 5. Files
  if (form.file instanceof File) {
    fd.append(FILE_FIELD, form.file);
  }
  if (form.files && Array.isArray(form.files)) {
    form.files.forEach(f => fd.append(FILE_FIELD, f));
  }

  return fd;
}

/* ==========================================================================
// BASIC CRUD
   ========================================================================== */

export async function listContracts(params = {}) {
  try {
    const response = await http.get("/contract", { params });
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hợp đồng:", error);
    return [];
  }
}

export async function getContractById(id) {
  try {
    const response = await http.get(`/contract/${id}`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi lấy hợp đồng ${id}:`, error);
    throw error;
  }
}

export async function createContract(contractData) {
  try {
    const payload = (contractData instanceof FormData)
        ? contractData
        : _buildContractFormData(contractData);

    const response = await http.post("/contract", payload);
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi tạo hợp đồng:", error);
    throw error;
  }
}

export async function updateContract(id, contractData) {
  try {
    const payload = (contractData instanceof FormData)
        ? contractData
        : _buildContractFormData(contractData);

    const response = await http.put(`/contract/${id}`, payload);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi cập nhật hợp đồng ${id}:`, error);
    throw error;
  }
}

export async function deleteContract(id) {
  try {
    const response = await http.delete(`/contract/${id}/permanent`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi xóa hợp đồng ${id}:`, error);
    throw error;
  }
}

/* ==========================================================================
// APPROVAL FLOW (NEW)
   ========================================================================== */

/** Tenant duyệt hợp đồng */
export async function approveContract(id) {
  try {
    const response = await http.post(`/contract/${id}/approve`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi duyệt hợp đồng ${id}:`, error);
    throw error;
  }
}

/* ==========================================================================
// TERMINATION FLOW (NEW)
   ========================================================================== */

/** Owner/Manager yêu cầu chấm dứt hợp đồng */
export async function requestTermination(id, data) {
  // data: { termination_date, note }
  try {
    const response = await http.post(`/contract/${id}/request-termination`, data);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi yêu cầu chấm dứt hợp đồng ${id}:`, error);
    throw error;
  }
}

/** Owner xác nhận hoàn tất giao dịch thanh lý (đã trả cọc/thanh toán xong) */
export async function completePendingTransaction(id) {
  try {
    const response = await http.post(`/contract/${id}/complete-transaction`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi hoàn tất thanh lý hợp đồng ${id}:`, error);
    throw error;
  }
}

/* ==========================================================================
// DOWNLOAD & FILES
   ========================================================================== */

/** Lấy thông tin download (URL signed hoặc metadata) - Ít dùng nếu dùng direct */
export async function downloadContractInfo(id) {
  try {
    const response = await http.get(`/contract/${id}/download`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin download ${id}:`, error);
    throw error;
  }
}

/** Tải file trực tiếp (Blob) và trigger download ở browser */
export async function downloadContractDirect(id, fileName = "contract.pdf") {
  try {
    const res = await http.get(`/contract/${id}/download/direct`, {
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: res.data.type || "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error(`Lỗi khi tải file hợp đồng ${id}:`, error);
    throw error;
  }
}

/** Lấy blob để preview (PDF Viewer) */
export async function fetchContractFileBlob(id) {
  try {
    const res = await http.get(`/contract/${id}/download/direct`, {
      responseType: "blob",
    });
    return res.data;
  } catch (error) {
    console.error(`Lỗi khi fetch blob file hợp đồng ${id}:`, error);
    throw error;
  }
}

/* ==========================================================================
// AI FEATURES
   ========================================================================== */

export async function processContractWithAI(file) {
  try {
    const fd = new FormData();
    fd.append("contract_file", file);

    const response = await http.post("/contract/import", fd, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi xử lý AI:", error);
    throw error;
  }
}