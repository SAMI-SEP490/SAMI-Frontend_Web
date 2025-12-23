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

  // 1. Mapping các ID (Lưu ý: EditPage hiện tại của bạn chưa có logic chọn lại Room ID hay Tenant ID, nhưng cứ giữ lại để map)
  // Kiểm tra cả snake_case và camelCase
  if (form.room_id || form.roomId) fd.append("room_id", form.room_id || form.roomId);
  if (form.tenant_user_id || form.tenantUserId) fd.append("tenant_user_id", form.tenant_user_id || form.tenantUserId);
  if (form.building_id || form.buildingId) fd.append("building_id", form.building_id || form.buildingId);

  // 2. Xử lý ngày tháng
  // Lấy giá trị từ form.start_date (React gửi) hoặc form.startDate
  const startDate = form.start_date || form.startDate;
  if (startDate) fd.append("start_date", _toISODate(startDate));

  const endDate = form.end_date || form.endDate;
  if (endDate) fd.append("end_date", _toISODate(endDate));

  // 3. Xử lý tiền tệ
  // React gửi form.rent_amount, Service cũ tìm form.rentAmount
  const rentAmount = (form.rent_amount !== undefined && form.rent_amount !== "")
      ? form.rent_amount
      : form.rentAmount;
  if (rentAmount !== undefined && rentAmount !== "") fd.append("rent_amount", rentAmount);

  const depositAmount = (form.deposit_amount !== undefined && form.deposit_amount !== "")
      ? form.deposit_amount
      : form.depositAmount;
  if (depositAmount !== undefined && depositAmount !== "") fd.append("deposit_amount", depositAmount);

  // 4. Các trường chung (status, note)
  if (form.status) fd.append("status", form.status);

  // Note có thể là chuỗi rỗng nhưng không được undefined
  const note = form.note !== undefined ? form.note : "";
  if (note !== undefined) fd.append("note", note);

  // 5. File
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
    const response = await http.delete(`/contract/${id}/permanent`);
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
export async function processContractWithAI(file) {
  try {
    const fd = new FormData();
    fd.append("contract_file", file); // Key này phải khớp với upload.single('contract_file') ở router

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
