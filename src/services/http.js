import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://api.example.com",
  timeout: 10000,
});

// Interceptor gắn token / map lỗi nếu cần
http.interceptors.request.use((cfg) => {
  // const token = localStorage.getItem('token')
  // if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg;
});
