// src/services/http.js
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";

export const http = axios.create({
  baseURL: apiBase,
  timeout: 20000,
  withCredentials: false, // bật true nếu BE dùng cookie HttpOnly
});

/** Lấy access token từ localStorage với các key có thể gặp */
function readAccessToken() {
  const KEYS = ["sami:access", "accessToken", "token", "sami_token"];
  for (const k of KEYS) {
    const v = localStorage.getItem(k);
    if (!v) continue;
    try {
      const obj = JSON.parse(v);
      if (obj?.accessToken) return obj.accessToken;
      if (obj?.token) return obj.token;
    } catch {
      return v; // là chuỗi thuần
    }
  }
  return null;
}

/** Gắn Authorization: Bearer <token> vào mọi request */
http.interceptors.request.use((config) => {
  const token = readAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Nếu 401 → xoá token và đưa về /login */
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      [
        "sami:access",
        "sami:refresh",
        "sami:user",
        "accessToken",
        "refreshToken",
      ].forEach((k) => localStorage.removeItem(k));
      if (window.location.pathname !== "/login")
        window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/** Helper lấy payload chuẩn: ưu tiên data.data rồi tới data */
export function unwrap(res) {
  if (!res) return res;
  const d = res.data;
  return d && typeof d === "object" && "data" in d ? d.data : d;
}

/** Helper thử nhiều path GET (dùng ở vài service) */
export async function tryGet(paths, config = {}) {
  let lastErr;
  for (const p of paths) {
    try {
      const r = await http.get(p, config);
      return unwrap(r);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** Helper thử nhiều path POST (nếu cần) */
export async function tryPost(paths, body, config = {}) {
  let lastErr;
  for (const p of paths) {
    try {
      const r = await http.post(p, body, config);
      return unwrap(r);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
