import React from "react";
import { colors } from "../constants/colors";
import { useNavigate } from "react-router-dom";

const SideBar = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: "220px",
        height: "100vh",
        backgroundColor: colors.brand,
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        color: "#fff",
        borderRadius: "8px",
      }}
    >
      <button
        onClick={() => navigate("/contracts")}
        style={{
          margin: "10px 0",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        Danh sách hợp đồng
      </button>

      <button
        onClick={() => navigate("/tenants")}
        style={{
          margin: "10px 0",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        Danh sách người thuê
      </button>

      <button
        onClick={() => navigate("/bills")}
        style={{
          margin: "10px 0",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        Danh sách hóa đơn
      </button>

      <button
        onClick={() => navigate("/receive-guest")}
        style={{
          margin: "10px 0",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        Danh sách đăng ký khách tạm trú
      </button>

      <button
        onClick={() => navigate("/notifications")}
        style={{
          margin: "10px 0",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        Danh sách thông báo
      </button>

      <button
        onClick={() => navigate("/maintaince-requests")}
        style={{
          margin: "10px 0",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        Danh sách bảo trì
      </button>
    </div>
  );
};

export default SideBar;
