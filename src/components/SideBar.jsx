import React from "react";
import { colors } from "../constants/colors";
import { useNavigate, useLocation } from "react-router-dom";

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("sami:user"));
  const role = user?.role;

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div
      style={{
        width: "240px",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "18px 14px",
        color: "#fff",

        /* 👇 glass sidebar */
        backgroundColor: "rgba(26, 115, 232, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",

        position: "sticky",
        top: 0,
        left: 0,
        boxShadow: "2px 0 14px rgba(0,0,0,0.1)",
      }}
    >
      <Section title="Thống kê" />

      <MenuButton
        label="Thống kê tổng hợp tài chính"
        active={isActive("/dashboard/timebase-report")}
        onClick={() => navigate("/dashboard/timebase-report")}
      />

      <MenuButton
        label="Thống kê tổng hợp người thuê"
        active={isActive("/dashboard/tenant-aggregates")}
        onClick={() => navigate("/dashboard/tenant-aggregates")}
      />

      <Section title="Quản lý" />

      <MenuButton
        label="Danh sách hợp đồng"
        active={isActive("/contracts")}
        onClick={() => navigate("/contracts")}
      />
      <MenuButton
        label="Danh sách người thuê"
        active={isActive("/tenants")}
        onClick={() => navigate("/tenants")}
      />
      <MenuButton
        label="Danh sách người dùng"
        active={isActive("/users")}
        onClick={() => navigate("/users")}
      />
      <MenuButton
        label="Danh sách hóa đơn"
        active={isActive("/bills")}
        onClick={() => navigate("/bills")}
      />
      <MenuButton
        label="Khách tạm trú"
        active={isActive("/receive-guest")}
        onClick={() => navigate("/receive-guest")}
      />
      <MenuButton
        label="Thông báo"
        active={isActive("/notifications")}
        onClick={() => navigate("/notifications")}
      />
      <MenuButton
        label="Quy định"
        active={isActive("/regulations")}
        onClick={() => navigate("/regulations")}
      />
      <MenuButton
        label="Bảo trì"
        active={isActive("/maintaince-requests")}
        onClick={() => navigate("/maintaince-requests")}
      />
      <MenuButton
        label="Đăng ký xe"
        active={isActive("/vehicle-registrations")}
        onClick={() => navigate("/vehicle-registrations")}
      />

      <Section title="Tòa nhà & Sơ đồ" />

      {role === "OWNER" && (
        <MenuButton
          label="Danh sách tòa nhà"
          active={isActive("/buildings")}
          onClick={() => navigate("/buildings")}
        />
      )}

      <MenuButton
        label="Danh sách phòng"
        active={isActive("/rooms")}
        onClick={() => navigate("/rooms")}
      />
      <MenuButton
        label="Sơ đồ tầng"
        active={isActive("/floorplan/view")}
        onClick={() => navigate("/floorplan/view")}
      />
    </div>
  );
};

const Section = ({ title }) => (
  <div
    style={{
      marginTop: 12,
      marginBottom: 4,
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: 0.5,
      color: "#FFE082",
      textTransform: "uppercase",
    }}
  >
    {title}
  </div>
);

const MenuButton = ({ label, onClick, active }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 12px",
      backgroundColor: active ? "rgba(255,255,255,0.2)" : "transparent",
      border: "none",
      borderRadius: 8,
      color: "#fff",
      cursor: "pointer",
      textAlign: "left",
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      transition: "all 0.2s ease",
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.12)";
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = "transparent";
    }}
  >
    {label}
  </button>
);

export default SideBar;
