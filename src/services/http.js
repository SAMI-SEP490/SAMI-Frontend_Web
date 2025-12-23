// src/services/http.js
import axios from "axios";

const RAW_BASE =
  import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_BASE_URL ?? "/api";
const API_BASE = String(RAW_BASE).replace(/\/$/, ""); // bỏ slash cuối

export const http = axios.create({
  baseURL: API_BASE, // ví dụ '/api' hoặc 'http://localhost:3000/api  '
  withCredentials: false,
  timeout: 50000,
});

// ---- helpers lấy/lưu token, hỗ trợ nhiều key cũ của bạn
export const getAccessToken = () =>
    localStorage.getItem("accessToken") ||
    localStorage.getItem("samiaccess") ||
    localStorage.getItem("sami:access");
const getRefreshToken = () =>
  localStorage.getItem("refreshToken") ||
  localStorage.getItem("samirefresh") ||
  localStorage.getItem("sami:refresh");

const setAccessToken = (t) => {
  if (!t) return;
  localStorage.setItem("accessToken", t);
  localStorage.setItem("samiaccess", t);
  localStorage.setItem("sami:access", t);
};
const setRefreshToken = (t) => {
  if (!t) return;
  localStorage.setItem("refreshToken", t);
  localStorage.setItem("samirefresh", t);
  localStorage.setItem("sami:refresh", t);
};

// ---- Attach Authorization
http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Refresh token 1 lần duy nhất khi 401
let isRefreshing = false;
let queue = [];
const flush = (token) => {
  queue.forEach(({ resolve, reject, config }) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      resolve(http(config));
    } else {
      reject(new axios.Cancel("No token to retry"));
    }
  });
  queue = [];
};

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { response, config } = err || {};
    if (!response) throw err;

    // tránh loop refresh
    if (response.status === 401 && !config.__retry) {
      config.__retry = true;
      queue.push({ resolve: (v) => v, reject: (e) => e, config });

      if (isRefreshing)
        return new Promise((resolve, reject) =>
          queue.push({ resolve, reject, config })
        );

      isRefreshing = true;
      try {
        const rt = getRefreshToken();
        if (!rt) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          { refreshToken: rt },
          { headers: { "Content-Type": "application/json" } }
        );
        const newAccess =
          data?.accessToken || data?.access?.token || data?.token;
        const newRefresh = data?.refreshToken || data?.refresh?.token;

        setAccessToken(newAccess);
        setRefreshToken(newRefresh);

        flush(newAccess);
        return http(config); // call lại request hiện tại
      } catch {
        // xóa sạch token -> để router xử lý điều hướng
        [
          "accessToken",
          "refreshToken",
          "samiaccess",
          "samirefresh",
          "sami:access",
          "sami:refresh",
          "samiuser",
        ].forEach((k) => localStorage.removeItem(k));
        flush(null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    throw err;
  }
);
export function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}
