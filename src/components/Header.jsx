import React, {useContext} from "react";
import { colors } from "../constants/colors";
import { Bell, User, LogOut } from "lucide-react"; // gói icon
import { Badge } from "react-bootstrap"; // hiển thị số thông báo
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { userData, userIdLogin } = useContext(UserContext);
  const navigate = useNavigate();

  const loggedInUser = userData.find(user => user.id == userIdLogin);
  return (
    <header
      style={{
        backgroundColor: colors.brand,
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 20px",
        height: "50px",
      }}
    >
      {/* Bên trái: logo hoặc tên app */}
      <strong style={{ fontSize: "16px" }}>SAMI</strong>

      {/* Bên phải: icon + tên user */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* Tên người dùng */}
        <span style={{ fontSize: "14px" }}>Xin chào {loggedInUser.full_name}!</span>
        {/* Icon chuông + badge đỏ */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <Bell size={20} color="#fff" />
          <Badge
            bg="danger"
            pill
            style={{
              position: "absolute",
              top: "-5px",
              right: "-8px",
              fontSize: "10px",
            }}
          >
            1
          </Badge>
        </div>

        {/* Icon user */}
        <User onClick={() =>(navigate("/profile"))} size={20} color="#fff" style={{ cursor: "pointer" }} />

        {/* Icon logout */}
        <LogOut onClick={() => (navigate("/login"))} size={20} color="#fff" style={{ cursor: "pointer" }} />
      </div>
    </header>
  );
}
