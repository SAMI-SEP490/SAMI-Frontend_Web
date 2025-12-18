// services/api/statistical.js
import { http, unwrap } from "../http";

// 📊 Lấy thống kê doanh thu theo năm
export async function getRevenueYearly(params = {}) {
  const { data } = await http.get("/payments/revenue/yearly", { params });
  return unwrap(data);
}

// 📅 Lấy chi tiết doanh thu theo tháng
export async function getRevenueMonthly(params = {}) {
  const { data } = await http.get("/payments/revenue/monthly", { params });
  return unwrap(data);
}

// 📥 Export file doanh thu (Excel / PDF)
export async function exportRevenue(params = {}) {
  const response = await http.get("/payments/revenue/export", {
    params,
    responseType: "blob", // 🔥 cần thiết để tải file
  });

  // unwrap không dùng cho blob → return trực tiếp
  return response.data;
}
