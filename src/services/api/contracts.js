// src/services/api/contracts.js
import { http, unwrap } from "../http";

const FILE_FIELD = "contract_file";
const ADDENDUM_URL = "/addendum";

/* ==========================================================================
// helpers
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
  const fd = new FormData();
  if (form.roomId) fd.append("room_id", form.roomId);
  if (form.tenantUserId) fd.append("tenant_user_id", form.tenantUserId);
  if (form.startDate) fd.append("start_date", _toISODate(form.startDate));
  if (form.endDate) fd.append("end_date", _toISODate(form.endDate));
  if (form.rentAmount !== undefined && form.rentAmount !== "") fd.append("rent_amount", form.rentAmount);
  if (form.depositAmount !== undefined && form.depositAmount !== "") fd.append("deposit_amount", form.depositAmount);
  if (form.status) fd.append("status", form.status);
  if (form.note !== undefined) fd.append("note", form.note);
  if (form.file instanceof File) {
    fd.append(FILE_FIELD, form.file);
  }
  return fd;
}

/* ==========================================================================
// CONTRACTS API
   ========================================================================== */

/** Lấy danh sách hợp đồng */
export async function listContracts() {
  try {
    const response = await http.get("/contract", { });
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
    const fd = _buildContractFormData(contractData);
    const response = await http.post("/contract", fd);
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi tạo hợp đồng:", error);
    throw error;
  }
}

export async function updateContract(id, contractData) {
  try {
    const fd = _buildContractFormData(contractData);
    const response = await http.put(`/contract/${id}`, fd);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi cập nhật hợp đồng ${id}:`, error);
    throw error;
  }
}

export async function deleteContract(id) {
  try {
    const response = await http.delete(`/contract/${id}`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi xóa hợp đồng ${id}:`, error);
    throw error;
  }
}

/** Tải file trực tiếp (vẫn giữ hành vi tải) */
export async function downloadContractDirect(id, fileName = "contract.pdf") {
  try {
    const res = await http.get(`/contract/${id}/download/direct`, {
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: res.data.type || "application/octet-stream" });
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

/** Lấy blob của file hợp đồng để preview (image/pdf/...) */
export async function fetchContractFileBlob(id) {
  try {
    const res = await http.get(`/contract/${id}/download/direct`, {
      responseType: "blob",
    });
    // trả về res.data (Blob)
    return res.data;
  } catch (error) {
    console.error(`Lỗi khi fetch blob file hợp đồng ${id}:`, error);
    throw error;
  }
}

/* ==========================================================================
// ADDENDUMS (PHỤ LỤC)
   ========================================================================== */
export async function getAddendumsByContractId(contractId) {
  try {
    const response = await http.get(`${ADDENDUM_URL}/contract/${contractId}`);
    return unwrap(response) || [];
  } catch (error) {
    return [];
  }
}
