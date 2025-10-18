// src/pages/tenant/TenantDetailPage.jsx
import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import Headers from "../../components/Header";
import Sidebar from "../../components/SideBar"; // đúng tên file của bạn
import { colors } from "../../constants/colors"; // đã có trong dự án

// ---- small reusable pieces ----
const Card = ({ title, children }) => (
  <div
    style={{
      width: "70%",
      backgroundColor: "#fff",
      borderRadius: 10,
      marginBottom: 24,
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        backgroundColor: colors.brand,
        color: "#fff",
        padding: "12px 20px",
        fontWeight: 700,
        fontSize: 16,
      }}
    >
      {title}
    </div>
    <div style={{ padding: 0 }}>{children}</div>
  </div>
);

const Row = ({ label, value, last }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 24,
      padding: "14px 20px",
      borderBottom: last ? "none" : "1px solid #E5E7EB",
      fontSize: 15,
    }}
  >
    <div style={{ width: 220, color: "#64748B" }}>{label}</div>
    <div style={{ flex: 1, color: "#0F172A", fontWeight: 600 }}>{value}</div>
  </div>
);

// ---- page ----
export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data (UI only). Sau này thay bằng API/Context.
  const tenant = {
    id: id || "001",
    full_name: "Nguyễn Văn A",
    phone: "0123456789",
    email: "abc@gmail.com",
    roomNo: "101",
    contractNo: "HD-001",
    contractStatus: "Đang hiệu lực",
    avatar:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=600&auto=format&fit=crop&q=60",
  };

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Headers />

      <div style={{ flex: 1, display: "flex", background: colors.background }}>
        <div
          style={{
            width: 240,
            backgroundColor: colors.brand,
            color: "#fff",
            borderRight: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <Sidebar />
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "36px 20px 56px",
            overflow: "auto",
          }}
        >
          {/* Avatar + caption */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img
              src={tenant.avatar}
              alt="avatar"
              style={{
                width: 130,
                height: 130,
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 6px 18px rgba(0,0,0,.15)",
              }}
            />
            <div
              style={{
                marginTop: 10,
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #D1D5DB",
                background: "#fff",
                color: "#374151",
                fontSize: 13,
              }}
            >
              Ảnh Đại Diện
            </div>
          </div>

          {/* Card: Thông tin người thuê */}
          <Card title="Thông tin người thuê">
            <Row label="ID" value={tenant.id} />
            <Row label="Tên người thuê" value={tenant.full_name} />
            <Row label="SDT" value={tenant.phone} />
            <Row label="Email" value={tenant.email} />
            <Row label="Số phòng" value={tenant.roomNo} last />
          </Card>

          {/* Card: Thông tin hợp đồng */}
          <Card title="Thông tin hợp đồng">
            <Row
              label="Hợp đồng số"
              value={
                <Link
                  to="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: colors.brand, textDecoration: "underline" }}
                >
                  {tenant.contractNo}
                </Link>
              }
            />
            <Row label="Trạng thái" value={tenant.contractStatus} last />
          </Card>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                height: 42,
                padding: "0 18px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                background: "#fff",
                color: "#111827",
                fontWeight: 700,
              }}
            >
              Quay lại
            </button>

            <button
              onClick={() => alert("Xoá (demo)")}
              style={{
                height: 42,
                padding: "0 24px",
                borderRadius: 8,
                border: "none",
                background: "#DC2626",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Xoá
            </button>

            <button
              onClick={() => alert("Sửa (demo)")}
              style={{
                height: 42,
                padding: "0 24px",
                borderRadius: 8,
                border: "none",
                background: colors.brand,
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
