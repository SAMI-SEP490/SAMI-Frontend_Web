import React from "react";
import { colors } from "../constants/colors";
import { useNavigate } from "react-router-dom";

const SideBar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("sami:user"));
  const role = user?.role;

  return (
    <div
      style={{
        width: "250px",
        height: "100vh",
        backgroundColor: colors.brand,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "16px 12px",
        color: "#fff",
        position: "sticky",
        top: 0,
        left: 0,
      }}
    >
      {/* <h3 style={{ margin: 0, marginBottom: 8, fontWeight: 800 }}>SAMI</h3> */}
      <div style={{ marginTop: 6, fontSize: 18, color: "yellow" }}>
        <b>Thống kê</b>
      </div>

      <button
        onClick={() => navigate("/dashboard/timebase-report")}
        style={buttonStyle}
      >
        Thống kê tổng hợp tài chính
      </button>

      <button
        onClick={() => navigate("/dashboard/tenant-aggregates")}
        style={buttonStyle}
      >
        Thống kê tổng hợp người thuê
      </button>

      <div style={{ marginTop: 6, fontSize: 18, color: "yellow" }}>
        <b>Quản lý</b>
      </div>

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

      <button onClick={() => navigate("/regulations")} style={buttonStyle}>
        Danh sách quy định
      </button>

      <button
        onClick={() => navigate("/maintaince-requests")}
        style={buttonStyle}
      >
        Danh sách bảo trì
      </button>

      <button
        onClick={() => navigate("/vehicle-registrations")}
        style={buttonStyle}
      >
        Danh sách đăng ký xe
      </button>

      <div style={{ marginTop: 6, fontSize: 18, color: "yellow" }}>
        <b>Tòa nhà và sơ đồ</b>
      </div>

      {/* ✅ Chỉ hiện khi role là OWNER */}
      {role === "OWNER" && (
        <button onClick={() => navigate("/buildings")} style={buttonStyle}>
          Danh sách tòa nhà
        </button>
      )}

      {/* ===== Floor plan (mới) ===== */}
      <button onClick={() => navigate("/floorplan/view")} style={buttonStyle}>
        Xem sơ đồ tầng
      </button>
    </div>
  );
};

const buttonStyle = {
  margin: "6px 0",
  background: "none",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  textAlign: "left",
};

export default SideBar;
