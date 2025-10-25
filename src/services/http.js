// src/services/api/http.js
import axios from "axios";

// baseURL của bạn
const baseURL =
  (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "/api";

export const http = axios.create({
  baseURL,
  withCredentials: false,
});

// Các endpoint PUBLIC (không cần token, KHÔNG auto-redirect khi 401)
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/verify-otp-forgot",
  "/auth/resend-otp-forgot",
  "/auth/reset-password",
];

export const unwrap = (res) => res?.data ?? res;

http.interceptors.request.use((config) => {
  const access = localStorage.getItem("sami:access") || localStorage.getItem("accessToken");
  const isPublic = PUBLIC_PATHS.some((p) => config.url?.startsWith(p));
  if (access && !isPublic) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Refresh token nhẹ – và KHÔNG đá về login với public APIs
let isRefreshing = false;
let queue = [];

function flushQueue(token) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { response, config } = error || {};
    const status = response?.status;
    const isPublic = PUBLIC_PATHS.some((p) => config?.url?.startsWith(p));

    if (status === 401 && !isPublic) {
      // chỉ auto-refresh cho API private
      if (!config._retry) {
        config._retry = true;
        const refresh =
          localStorage.getItem("sami:refresh") ||
          localStorage.getItem("refreshToken");
        if (refresh) {
          try {
            if (!isRefreshing) {
              isRefreshing = true;
              const res = await axios.post(`${baseURL}/auth/refresh-token`, {
                refreshToken: refresh,
              });
              const newToken =
                res?.data?.accessToken ||
                res?.data?.token ||
                res?.data?.access_token;
              if (newToken) {
                localStorage.setItem("sami:access", newToken);
                localStorage.setItem("accessToken", newToken);
              }
              isRefreshing = false;
              flushQueue(newToken);
            }

            return new Promise((resolve) => {
              queue.push((newToken) => {
                if (newToken) {
                  config.headers.Authorization = `Bearer ${newToken}`;
                }
                resolve(http(config));
              });
            });
          } catch {
            isRefreshing = false;
            flushQueue(null);
          }
        }
      }

      // Nếu vẫn 401: dọn token nhưng KHÔNG redirect nếu đang ở public flow
      [
        "sami:access",
        "accessToken",
        "sami:refresh",
        "refreshToken",
        "sami:user",
      ].forEach((k) => localStorage.removeItem(k));
      // Không window.location = "/login" ở đây -> để router tự xử lý
    }

    // Với public endpoints, trả lỗi về trang hiện tại (không chuyển trang)
    return Promise.reject(error);
  }
);
