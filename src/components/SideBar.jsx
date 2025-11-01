import React from "react";
import { colors } from "../constants/colors";
import { useNavigate } from "react-router-dom";

const SideBar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("sami:user")); // lấy user từ localStorage
  console.log("Logged in user:", user);
  const role = user?.role; // lấy role (nếu có)

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
      <button onClick={() => navigate("/contracts")} style={buttonStyle}>
        Danh sách hợp đồng
      </button>

      <button onClick={() => navigate("/tenants")} style={buttonStyle}>
        Danh sách người thuê
      </button>

      <button onClick={() => navigate("/bills")} style={buttonStyle}>
        Danh sách hóa đơn
      </button>

      <button onClick={() => navigate("/receive-guest")} style={buttonStyle}>
        Danh sách đăng ký khách tạm trú
      </button>

      <button onClick={() => navigate("/notifications")} style={buttonStyle}>
        Danh sách thông báo
      </button>

      <button
        onClick={() => navigate("/maintaince-requests")}
        style={buttonStyle}
      >
        Danh sách bảo trì
      </button>

      {/* ✅ Chỉ hiện khi role là OWNER */}
      {role === "OWNER" && (
        <button onClick={() => navigate("/buildings")} style={buttonStyle}>
          Danh sách tòa nhà
        </button>
      )}
    </div>
  );
};

const buttonStyle = {
  margin: "10px 0",
  background: "none",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  textAlign: "left",
};

export default SideBar;
