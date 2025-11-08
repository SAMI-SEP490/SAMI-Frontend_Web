import React, { useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { FaPrint, FaSave } from "react-icons/fa";

// --- Dữ liệu mẫu ---
const sampleData = {
  Ngày: [
    { name: "Doanh thu", value: 30000000 },
    { name: "Chi phí", value: 15000000 },
    { name: "Lợi nhuận", value: 15000000 },
  ],
  Tháng: [
    { name: "Doanh thu", value: 900000000 },
    { name: "Chi phí", value: 450000000 },
    { name: "Lợi nhuận", value: 450000000 },
  ],
  Năm: [
    { name: "Doanh thu", value: 12000000000 },
    { name: "Chi phí", value: 7000000000 },
    { name: "Lợi nhuận", value: 5000000000 },
  ],
};

export default function ViewTimeBasedReportsPage() {
  const [reportType, setReportType] = useState("Ngày");
  const [selectedDate, setSelectedDate] = useState("2025-10-02");

  const data = sampleData[reportType];
  const profitMargin = ((data[2].value / data[0].value) * 100).toFixed(0);
  const COLORS = ["#3B82F6", "#F97316", "#10B981"];

  const formatYAxis = (value) => `${value / 1000000}M`;
  const formatNumber = (value) =>
    value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 10,
          borderRadius: "10px",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Header />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "220px",
            backgroundColor: colors.brand,
            color: "white",
            height: "100%",
            position: "sticky",
            top: 0,
            borderRadius: "10px",
          }}
        >
          <Sidebar />
        </div>

        {/* Nội dung chính */}
        <div
          style={{
            flex: 1,
            background: colors.background,
            padding: "24px",
            overflowY: "auto",
          }}
        >
          {/* Header trang */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontWeight: 700 }}>Thống kê tổng hợp tài chính</h2>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{
                  background: "#2563EB",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FaPrint /> In
              </button>
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
              >
                <FaSave /> Lưu
              </button>
            </div>
          </div>

          {/* Bộ lọc */}
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
              style={{ padding: "4px 8px", borderRadius: 6 }}
            >
              <option>Ngày</option>
              <option>Tháng</option>
              <option>Năm</option>
            </select>

            <label>Chọn ngày:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 6 }}
            />
          </div>

          {/* Nội dung thống kê */}
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              padding: "20px 24px",
            }}
          >
            <h3 style={{ marginBottom: 12 }}>
              Thống kê tài chính theo {reportType.toLowerCase()}{" "}
              {new Date(selectedDate).toLocaleDateString("vi-VN")}
            </h3>

            <div
              style={{
                color: "#EA580C",
                fontWeight: 600,
                marginBottom: 12,
                lineHeight: "1.8em",
              }}
            >
              <p style={{ margin: 0 }}>
                Doanh thu: {formatNumber(data[0].value)} VND
              </p>
              <p style={{ margin: 0 }}>
                Chi phí: {formatNumber(data[1].value)} VND
              </p>
              <p style={{ margin: 0 }}>
                Lợi nhuận: {formatNumber(data[2].value)} VND
              </p>
            </div>

            {/* Biểu đồ */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-evenly",
                alignItems: "center",
                marginTop: 30,
                flexWrap: "wrap",
              }}
            >
              {/* Biểu đồ cột */}
              <div style={{ position: "relative" }}>
                <BarChart width={400} height={250} data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip formatter={(v) => `${v / 1000000}M`} />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6">
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    />
                  </Bar>
                </BarChart>
              </div>

              {/* Biểu đồ tròn */}
              <div style={{ textAlign: "center", position: "relative" }}>
                <div
                  style={{
                    color: "#DC2626",
                    fontWeight: 700,
                    fontSize: 16,
                    marginBottom: 10,
                  }}
                >
                  Biên lợi nhuận: {profitMargin}%
                </div>

                <PieChart width={260} height={260}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="55%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v / 1000000}M`} />
                </PieChart>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
