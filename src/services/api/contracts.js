import { http, unwrap } from "../http";

// Thử lần lượt các đường dẫn cho cùng một ý nghĩa
const LIST_PATHS = [
  "/contracts",
  "/contract",
  "/contracts/list",
  "/contract/list",
];
const DETAIL_PATHS = ["/contracts/:id", "/contract/:id"];
const CREATE_PATHS = ["/contracts", "/contract"];
const UPDATE_PATHS = ["/contracts/:id", "/contract/:id"];
const DELETE_PATHS = ["/contracts/:id", "/contract/:id"];
const DOWNLOAD_PATHS = ["/contracts/:id/download", "/contract/:id/download"];
const DOWNLOAD_DIRECT_PATHS = [
  "/contracts/:id/download/direct",
  "/contract/:id/download/direct",
];

// Helper: gọi từng path cho tới khi thành công (2xx)
async function tryGet(paths, replace = {}) {
  let lastErr;
  for (const p of paths) {
    const url = p.replace(/:id/g, replace.id ?? "");
    try {
      const res = await http.get(url, replace.options || {});
      return unwrap(res);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
async function tryPost(paths, body, replace = {}) {
  let lastErr;
  for (const p of paths) {
    const url = p.replace(/:id/g, replace.id ?? "");
    try {
      const res = await http.post(url, body, replace.options || {});
      return unwrap(res);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
async function tryPut(paths, body, replace = {}) {
  let lastErr;
  for (const p of paths) {
    const url = p.replace(/:id/g, replace.id ?? "");
    try {
      const res = await http.put(url, body, replace.options || {});
      return unwrap(res);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
async function tryDelete(paths, replace = {}) {
  let lastErr;
  for (const p of paths) {
    const url = p.replace(/:id/g, replace.id ?? "");
    try {
      const res = await http.delete(url, replace.options || {});
      return unwrap(res);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** Danh sách hợp đồng */
export async function listContracts(params = {}) {
  return tryGet(LIST_PATHS, { options: { params } });
}

/** Chi tiết hợp đồng */
export async function getContract(id) {
  return tryGet(DETAIL_PATHS, { id });
}

/** Tạo hợp đồng (multipart/form-data) */
export async function createContract(body = {}) {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v == null) return;
    if (k === "file" && v instanceof File) fd.append("file", v);
    else fd.append(k, String(v));
  });
  return tryPost(CREATE_PATHS, fd, {
    options: { headers: { "Content-Type": "multipart/form-data" } },
  });
}

/** Cập nhật hợp đồng (multipart/form-data) */
export async function updateContract(id, body = {}) {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v == null) return;
    if (k === "file" && v instanceof File) fd.append("file", v);
    else fd.append(k, String(v));
  });
  return tryPut(UPDATE_PATHS, fd, {
    id,
    options: { headers: { "Content-Type": "multipart/form-data" } },
  });
}

/** Xoá hợp đồng */
export async function deleteContract(id) {
  return tryDelete(DELETE_PATHS, { id });
}

/** Lấy link tải PDF (nếu BE cấp presigned URL) */
export async function getDownloadUrl(id) {
  return tryGet(DOWNLOAD_PATHS, { id });
}

/** Tải trực tiếp (blob) */
export async function downloadContractDirect(id, filename = "contract.pdf") {
  // thử các path trả blob
  let blob;
  for (const p of DOWNLOAD_DIRECT_PATHS) {
    const url = p.replace(/:id/g, id);
    try {
      const res = await http.get(url, { responseType: "blob" });
      blob = res.data;
      break; // đã tải được => thoát vòng lặp
    } catch {
      continue; // thất bại => thử path tiếp theo (không vi phạm no-empty)
    }
  }
  if (!blob) throw new Error("Không tải được file hợp đồng");

  const file = new Blob([blob], { type: "application/pdf" });
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
