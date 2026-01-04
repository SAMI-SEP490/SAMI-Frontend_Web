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
  // Nếu form đã là FormData thì trả về luôn, không xử lý lại
  if (form instanceof FormData) {
    return form;
  }

  const fd = new FormData();

  // 1. Mapping các ID
  if (form.room_id || form.roomId) fd.append("room_id", form.room_id || form.roomId);
  if (form.tenant_user_id || form.tenantUserId) fd.append("tenant_user_id", form.tenant_user_id || form.tenantUserId);
  if (form.building_id || form.buildingId) fd.append("building_id", form.building_id || form.buildingId);

  // 2. Xử lý ngày tháng
  const startDate = form.start_date || form.startDate;
  if (startDate) fd.append("start_date", _toISODate(startDate));

  const endDate = form.end_date || form.endDate;
  if (endDate) fd.append("end_date", _toISODate(endDate));

  // 3. Xử lý tiền tệ
  const rentAmount = (form.rent_amount !== undefined && form.rent_amount !== "")
      ? form.rent_amount
      : form.rentAmount;
  if (rentAmount !== undefined && rentAmount !== "") fd.append("rent_amount", rentAmount);

  const depositAmount = (form.deposit_amount !== undefined && form.deposit_amount !== "")
      ? form.deposit_amount
      : form.depositAmount;
  if (depositAmount !== undefined && depositAmount !== "") fd.append("deposit_amount", depositAmount);

  // Xử lý penalty_rate (nếu có)
  if (form.penalty_rate !== undefined) fd.append("penalty_rate", form.penalty_rate);
  if (form.payment_cycle_months !== undefined) fd.append("payment_cycle_months", form.payment_cycle_months);

  // 4. Các trường chung (status, note)
  if (form.status) fd.append("status", form.status);

  const note = form.note !== undefined ? form.note : "";
  if (note !== undefined) fd.append("note", note);

  // 5. File (Single file legacy support)
  if (form.file instanceof File) {
    fd.append(FILE_FIELD, form.file);
  }

  // Support mảng files nếu truyền dạng object (tuy nhiên CreateContractPage đã xử lý việc này rồi)
  if (form.files && Array.isArray(form.files)) {
    form.files.forEach(f => fd.append(FILE_FIELD, f));
  }

  return fd;
}

/* ==========================================================================
// CONTRACTS API
   ========================================================================== */

/** Lấy danh sách hợp đồng */
export async function listContracts(params = {}) {
  try {
    const response = await http.get("/contract", { params }); // Pass params (filters)
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hợp đồng:", error);
    return []; // Return empty array or object structure depending on backend pagination
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
    // FIX: Kiểm tra nếu contractData đã là FormData thì dùng luôn
    // Nếu là Object thường thì mới chạy qua _buildContractFormData
    const payload = (contractData instanceof FormData)
        ? contractData
        : _buildContractFormData(contractData);

    // Không cần set Content-Type thủ công, axios/browser tự set multipart/form-data khi payload là FormData
    const response = await http.post("/contract", payload);
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi tạo hợp đồng:", error);
    throw error;
  }
}

export async function updateContract(id, contractData) {
  try {
    // FIX: Tương tự như create, kiểm tra FormData
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

/** Tải file trực tiếp */
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

/** Lấy blob của file hợp đồng để preview */
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