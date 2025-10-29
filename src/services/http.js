// src/services/api/http.js
import axios from "axios";

const baseURL = import.meta?.env?.VITE_API_BASE_URL || "/api";

export const http = axios.create({
  baseURL,
  withCredentials: false,
});

export const unwrap = (res) => res?.data ?? res;

// ✅ CHỈ những API thực sự công khai mới để ở đây
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/verify-otp-forgot",
  "/auth/resend-otp-forgot",
  "/auth/reset-password",
  // ❌ KHÔNG đưa "/auth/register" vào đây nữa
];

http.interceptors.request.use((config) => {
  const isPublic = PUBLIC_PATHS.some((p) => config.url?.startsWith(p));
  const access =
    localStorage.getItem("sami:access") || localStorage.getItem("accessToken");
  if (access && !isPublic) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});
