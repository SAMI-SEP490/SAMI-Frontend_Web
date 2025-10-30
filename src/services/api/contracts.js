// src/services/api/contracts.js
import { http } from "../http";

// gọn nhẹ: unwrap dữ liệu (tránh phụ thuộc nếu http.js chưa export unwrap)
const u = (res) => res?.data?.data ?? res?.data ?? res;

// chuẩn hoá response list về { items, total, page, limit }
function normalizeList(raw, fallbackPage = 1, fallbackLimit = 10) {
  const items = raw?.items ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
  return {
    items,
    total: raw?.total ?? raw?.pagination?.total ?? items.length ?? 0,
    page: raw?.page ?? raw?.pagination?.page ?? fallbackPage,
    limit: raw?.limit ?? raw?.pagination?.limit ?? fallbackLimit,
  };
}

// GET /api/contract/list hoặc /api/contract
export async function listContracts({ page = 1, limit = 10, ...filters } = {}) {
  const params = { page, limit, ...filters };
  const CANDIDATES = ["/contract/list", "/contract"]; // fallback tránh 404
  let lastErr;
  for (const p of CANDIDATES) {
    try {
      const res = await http.get(p, { params });
      return normalizeList(u(res), page, limit);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// GET /api/contract/:id
export async function getContract(id) {
  if (!id) throw new Error("Missing contract id");
  const res = await http.get(`/contract/${id}`);
  return u(res);
}

// POST /api/contract (multipart/form-data)
// Nhận cả FormData hoặc object thường
export async function createContract(payload = {}) {
  let body;
  if (payload instanceof FormData) {
    body = payload;
  } else {
    body = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") body.append(k, v);
    });
  }
  // field file => 'file' (đúng với BE dùng multer.single('file'))
  const res = await http.post("/contract", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return u(res);
}

// PUT /api/contract/:id (multipart nếu có file mới)
export async function updateContract(id, payload = {}) {
  if (!id) throw new Error("Missing contract id");
  let body;
  const maybeMultipart =
    payload instanceof FormData ||
    Object.values(payload).some((v) => v instanceof File || v instanceof Blob);

  if (payload instanceof FormData) {
    body = payload;
  } else if (maybeMultipart) {
    body = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) body.append(k, v);
    });
  } else {
    body = payload;
  }

  const res = await http.put(`/contract/${id}`, body, {
    headers: maybeMultipart ? { "Content-Type": "multipart/form-data" } : {},
  });
  return u(res);
}

// DELETE /api/contract/:id (soft delete)
export async function deleteContract(id) {
  if (!id) throw new Error("Missing contract id");
  const res = await http.delete(`/contract/${id}`);
  return u(res);
}

// GET /api/contract/:id/download  -> trả về { url } (presigned URL)
export async function getDownloadUrl(id) {
  if (!id) throw new Error("Missing contract id");
  try {
    const res = await http.get(`/contract/${id}/download`);
    const data = u(res);
    // chuẩn: { url }, fallback: { data: { url } } hoặc { downloadUrl }
    const url = data?.url ?? data?.downloadUrl ?? data?.data?.url;
    return { url };
  } catch {
    return { url: null };
  }
}

// GET /api/contract/:id/download/direct -> stream PDF
// Hàm này chủ động tải file luôn (để gọi thẳng từ UI)
export async function downloadContractDirect(id) {
  if (!id) throw new Error("Missing contract id");
  const res = await http.get(`/contract/${id}/download/direct`, {
    responseType: "blob",
  });
  const contentType = res?.headers?.["content-type"] || "application/pdf";
  const blob = new Blob([res.data], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contract-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// (tuỳ nhu cầu BE) các API nâng cao
export async function restoreContract(id) {
  const res = await http.post(`/contract/${id}/restore`);
  return u(res);
}
export async function hardDeleteContract(id) {
  const res = await http.delete(`/contract/${id}/hard`);
  return u(res);
}
export async function terminateContract(id, reason) {
  const res = await http.post(`/contract/${id}/terminate`, { reason });
  return u(res);
}
