// src/services/api/contracts.js
import { http } from "../http";

const un = (res) => res?.data?.data ?? res?.data ?? res;
const FILE_FIELD = "contract_file"; // <-- khớp Multer ở BE

/** ===== LIST: không phân trang (tạm) ===== */
export async function listContracts() {
  try {
    const res = await http.get("/contract/", {
      validateStatus: () => true,
    });
    if (res.status >= 200 && res.status < 300) {
      const data = un(res);
      const items =
        data?.items ??
        (Array.isArray(data?.data) ? data.data : undefined) ??
        (Array.isArray(data) ? data : undefined) ??
        [];
      return { items, total: items.length, _status: res.status };
    }
    return { items: [], total: 0, _status: res.status };
  } catch {
    return { items: [], total: 0, _status: "network_error" };
  }
}

/** ===== DETAIL ===== */
export async function getContract(id) {
  if (!id) throw new Error("Missing contract id");
  const res = await http.get(`/contract/${id}`);
  return un(res);
}

/** ===== CREATE (multipart) =====
 * form: {
 *  roomId, tenantUserId, startDate, endDate,
 *  rentAmount?, depositAmount?, status?, note?, file?(File)
 * }
 */
export async function createContract(form = {}) {
  const fd = new FormData();

  // map camelCase -> snake_case; chỉ append khi có giá trị
  if (form.roomId) fd.append("room_id", Number(form.roomId));
  if (form.tenantUserId) fd.append("tenant_user_id", Number(form.tenantUserId));
  if (form.startDate) fd.append("start_date", toISODate(form.startDate));
  if (form.endDate) fd.append("end_date", toISODate(form.endDate));
  if (form.rentAmount) fd.append("rent_amount", String(form.rentAmount));
  if (form.depositAmount)
    fd.append("deposit_amount", String(form.depositAmount));
  // default status 'pending' nếu không truyền từ form
  fd.append("status", String(form.status ?? "pending"));
  if (form.note) fd.append("note", String(form.note));

  // file: BE yêu cầu 'contract_file'
  if (form.file instanceof File) {
    fd.append(FILE_FIELD, form.file);
  }

  const res = await http.post("/contract", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return un(res);
}

/** ===== UPDATE (multipart nếu có file) ===== */
export async function updateContract(id, form = {}) {
  if (!id) throw new Error("Missing contract id");
  const hasFile = form.file instanceof File || form.file instanceof Blob;

  if (hasFile) {
    const fd = new FormData();
    if (form.startDate) fd.append("start_date", toISODate(form.startDate));
    if (form.endDate) fd.append("end_date", toISODate(form.endDate));
    if (form.rentAmount) fd.append("rent_amount", String(form.rentAmount));
    if (form.depositAmount)
      fd.append("deposit_amount", String(form.depositAmount));
    if (form.status) fd.append("status", String(form.status));
    if (form.note) fd.append("note", String(form.note));
    fd.append(FILE_FIELD, form.file); // <-- tên field file khi update

    const res = await http.put(`/contract/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return un(res);
  }

  const body = {
    ...(form.startDate ? { start_date: toISODate(form.startDate) } : {}),
    ...(form.endDate ? { end_date: toISODate(form.endDate) } : {}),
    ...(form.rentAmount ? { rent_amount: String(form.rentAmount) } : {}),
    ...(form.depositAmount
      ? { deposit_amount: String(form.depositAmount) }
      : {}),
    ...(form.status ? { status: String(form.status) } : {}),
    ...(form.note ? { note: String(form.note) } : {}),
  };

  const res = await http.put(`/contract/${id}`, body);
  return un(res);
}

/** ===== DELETE ===== */
export async function deleteContract(id) {
  if (!id) throw new Error("Missing contract id");
  const res = await http.delete(`/contract/${id}`);
  return un(res);
}

/** ===== DOWNLOADS ===== */
export async function getDownloadUrl(id) {
  if (!id) throw new Error("Missing contract id");
  try {
    const res = await http.get(`/contract/${id}/download`);
    const data = un(res);
    const url = data?.url ?? data?.downloadUrl ?? data?.data?.url;
    return { url: url || null };
  } catch {
    return { url: null };
  }
}

export async function downloadContractDirect(id, returnBlob = false) {
  if (!id) throw new Error("Missing contract id");

  const res = await http.get(`/contract/${id}/download/direct`, {
    responseType: "blob",
  });

  const contentType = res?.headers?.["content-type"] || "application/pdf";
  const blob = new Blob([res.data], { type: contentType });

  // nếu FE cần lấy blob → trả về để FE xử lý tiếp
  if (returnBlob) return { blob };

  // mặc định: tải trực tiếp
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contract-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** ===== Helpers ===== */
function toISODate(v) {
  if (!v) return "";
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  const m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    return `${m[3]}-${mo}-${d}`;
  }
  return String(v).slice(0, 10);
}
