import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
});

// Ưu tiên cả 2 key để tương thích phần còn lại trong app
const getAccessToken = () =>
  localStorage.getItem("sami:access") || localStorage.getItem("accessToken");

http.interceptors.request.use((cfg) => {
  const tk = getAccessToken();
  if (tk) cfg.headers.Authorization = `Bearer ${tk}`;
  return cfg;
});

// helper chuẩn hóa trả về
export function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}
