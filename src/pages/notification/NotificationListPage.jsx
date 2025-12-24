// src/pages/notification/NotificationListPage.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { ROUTES } from "../../constants/routes";

export default function NotificationListPage() {
  const navigate = useNavigate();

  const goToCreate = () => {
    navigate(ROUTES.createNotification);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: 24,
      }}
    >
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ fontWeight: 700, marginBottom: 4 }}>
            Quản lý thông báo
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
            Trang này dùng để <b>tạo và gửi thông báo</b> cho cư dân/tenant, cư
            dân sẽ đọc thông báo trên <b>ứng dụng mobile</b>.
          </p>
        </div>

        <button
          type="button"
          onClick={goToCreate}
          style={{
            background: "#0F3D8A",
            color: "#fff",
            padding: "8px 18px",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Tạo thông báo mới
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 20,
          borderRadius: 10,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
        }}
      >
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 0 }}>
          Hiện tại hệ thống không lưu lịch sử thông báo trên web. Khi bạn bấm{" "}
          <b>"Tạo thông báo mới"</b> và gửi, backend sẽ gửi thông báo đến cư
          dân/tenant, và họ sẽ xem thông báo trên <b>app mobile SAMI</b>.
        </p>
      </div>
    </div>
  );
}
