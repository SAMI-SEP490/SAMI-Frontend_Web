import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { FaSave } from "react-icons/fa";
import {
  getRevenueMonthly,
  getRevenueYearly,
} from "../../services/api/statistical";
import { http } from "../../services/http"; // 🔹 thêm dòng này
import { saveAs } from "file-saver";

export default function ViewTimeBasedReportsPage() {
  const now = new Date();
  const [reportType, setReportType] = useState("Tháng");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [type, setType] = useState("xlsx"); // 🔹 thêm state cho kiểu file
  const [data, setData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [param, setParam] = useState({ year, month, format: type }); // 🔹 dùng type

  const formatNumber = (n) =>
    n?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  async function exportRevenue(params = {}) {
    try {
      const response = await http.get("/payments/revenue/export", {
        params,
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `revenue_report.${type}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match && match[1]) fileName = match[1];
      }

      const blob = new Blob([response.data], { type: response.data.type });
      saveAs(blob, fileName);
    } catch (error) {
      console.error("❌ Lỗi xuất báo cáo:", error);
    }
  }

  async function fetchData() {
    try {
      if (reportType === "Tháng") {
        const res = await getRevenueMonthly({ year, month });
        const list = res ?? [];
        setParam({ year, month, format: type });

        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          revenue: 0,
        }));

        list.forEach((payment) => {
          const day = new Date(payment.payment_date).getDate();
          dailyData[day - 1].revenue += Number(payment.amount || 0);
        });

        const total = dailyData.reduce((s, v) => s + v.revenue, 0);

        setData(dailyData);
        setTotalRevenue(total);
      }

      if (reportType === "Năm") {
        const res = await getRevenueYearly({ year });
        const list = res ?? [];
        setParam({ year, format: type });

        const formatted = list.map((m) => ({
          month: `Tháng ${m.month}`,
          revenue: Number(m.total_revenue),
        }));

        const total = formatted.reduce((s, v) => s + v.revenue, 0);

        setData(formatted);
        setTotalRevenue(total);
      }
    } catch (e) {
      console.error("❌ Lỗi load thống kê:", e);
    }
  }

  useEffect(() => {
    fetchData();
  }, [reportType, year, month, type]); // 🔹 thêm type vào dependency

  return (
    <div style={{ minHeight: "100vh", padding: 24, background: "#F4F6FA" }}>
      {/* ================= HEADER ================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
          alignItems: "center",
          gap: 12,
        }}
      >
        <h2 style={{ fontWeight: 700 }}>Thống kê tài chính</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* 🔹 Select kiểu file */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6 }}
          >
            <option value="xlsx">XLSX</option>
            <option value="csv">CSV</option>
          </select>

          <button
            style={{
              background: "#059669",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onClick={() => {
              exportRevenue(param);
            }}
          >
            <FaSave /> Lưu báo cáo
          </button>
        </div>
      </div>

      {/* ================= FILTER ================= */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <label>Báo cáo theo:</label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option>Tháng</option>
          <option>Năm</option>
        </select>

        <label>Năm:</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{ width: 90, padding: 6 }}
        />

        {reportType === "Tháng" && (
          <>
            <label>Tháng:</label>
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ width: 70, padding: 6 }}
            />
          </>
        )}
      </div>

      {/* ================= SUMMARY + CHART ================= */}
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,.05)",
        }}
      >
        <h3 style={{ marginBottom: 12 }}>
          Báo cáo{" "}
          {reportType === "Tháng" ? `Tháng ${month}/${year}` : `Năm ${year}`}
        </h3>

        <div
          style={{
            marginBottom: 15,
            fontWeight: 700,
            fontSize: 18,
            color: "#2563EB",
          }}
        >
          Doanh thu: {formatNumber(totalRevenue)} VND
        </div>

        <div style={{ overflowX: "auto", paddingBottom: 10 }}>
          {reportType === "Tháng" && (
            <BarChart width={data.length * 45} height={280} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(v) => `${formatNumber(v)} VND`} />
              <Legend />
              <Bar dataKey="revenue" name="Doanh thu" fill="#3B82F6" />
            </BarChart>
          )}

          {reportType === "Năm" && (
            <BarChart width={data.length * 80} height={280} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => `${formatNumber(v)} VND`} />
              <Legend />
              <Bar dataKey="revenue" name="Doanh thu" fill="#3B82F6" />
            </BarChart>
          )}
        </div>
      </div>
    </div>
  );
}
