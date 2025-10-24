// src/services/http.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const storage = {
  get access() {
    return localStorage.getItem("sami:access") || "";
  },
  set access(v) {
    localStorage.setItem("sami:access", v || "");
  },
  get refresh() {
    return localStorage.getItem("sami:refresh") || "";
  },
  set refresh(v) {
    localStorage.setItem("sami:refresh", v || "");
  },
  clear() {
    localStorage.removeItem("sami:access");
    localStorage.removeItem("sami:refresh");
    localStorage.removeItem("sami:user");
  },
};

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

http.interceptors.request.use((cfg) => {
  const token = storage.access;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let refreshing = false;
let waiters = [];

async function refreshAccessToken() {
  if (refreshing) {
    return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
  }
  refreshing = true;
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
      refreshToken: storage.refresh,
    });
    const newToken = data?.data?.accessToken ?? data?.accessToken;
    if (!newToken) throw new Error("No accessToken in refresh response");
    storage.access = newToken;
    waiters.forEach((w) => w.resolve(newToken));
    waiters = [];
    return newToken;
  } catch (e) {
    waiters.forEach((w) => w.reject(e));
    waiters = [];
    storage.clear();
    throw e;
  } finally {
    refreshing = false;
  }
}

http.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config || {};
    if (status === 401 && storage.refresh && !original._retried) {
      try {
        const token = await refreshAccessToken();
        original._retried = true;
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${token}`,
        };
        return http.request(original);
      } catch {
        // Optional: window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// Luôn lấy phần data bên trong (dù backend có bọc {data:...} hay không)
export const unwrap = (resp) => resp?.data?.data ?? resp?.data ?? resp;
