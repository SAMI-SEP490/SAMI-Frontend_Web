import { http, unwrap } from "../http";

export async function listContracts(params = {}) {
  const res = await http.get("/contracts", { params });
  return unwrap(res);
}

export async function getContract(id) {
  const res = await http.get(`/contracts/${id}`);
  return unwrap(res);
}

export async function createContract(body = {}) {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (k === "file" && v instanceof File) fd.append("file", v);
    else fd.append(k, String(v));
  });
  const res = await http.post("/contracts", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(res);
}

export async function updateContract(id, body = {}) {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (k === "file" && v instanceof File) fd.append("file", v);
    else fd.append(k, String(v));
  });
  const res = await http.put(`/contracts/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(res);
}

export async function deleteContract(id) {
  const res = await http.delete(`/contracts/${id}`);
  return unwrap(res);
}

export async function getDownloadUrl(id) {
  const res = await http.get(`/contracts/${id}/download`);
  return unwrap(res); // kỳ vọng { download_url, ... }
}

export async function downloadContractDirect(id, filename = "contract.pdf") {
  const res = await http.get(`/contracts/${id}/download/direct`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(
    new Blob([res.data], { type: "application/pdf" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
