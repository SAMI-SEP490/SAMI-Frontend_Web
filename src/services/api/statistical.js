// services/api/statistical.js
import { http, unwrap } from "../http";

// 📊 Lấy thống kê doanh thu theo năm
export async function getRevenueYearly(params = {}) {
  const { data } = await http.get("/payment/revenue/yearly", { params });
  return unwrap(data);
}

// 📅 Lấy chi tiết doanh thu theo tháng
export async function getRevenueMonthly(params = {}) {
  const { data } = await http.get("/payment/revenue/monthly", { params });
  return unwrap(data);
}
0;
