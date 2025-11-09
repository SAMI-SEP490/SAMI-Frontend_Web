import React, { useEffect, useState } from "react";
import { colors } from "../constants/colors";
import { Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getProfile, logout as apiLogout } from "../services/api/auth";

export default function Header() {
  // cache tạm để không trắng tên
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sami:user") || "null");
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getProfile();
        const u = data?.data || data;
        if (alive) setUser(u);
        localStorage.setItem("sami:user", JSON.stringify(u));
      } catch {
        // không chặn render
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const displayName = user?.full_name || user?.name || user?.email || "bạn";

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.warn("Logout API failed:", err);
    } finally {
      [
        "sami:access",
        "sami:refresh",
        "sami:user",
        "accessToken",
        "refreshToken",
      ].forEach((k) => localStorage.removeItem(k));
      navigate("/login", { replace: true });
    }
  };

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
      <strong style={{ fontSize: "16px" }}>SAMI</strong>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ fontSize: 14 }}>Xin chào {displayName}!</span>

        <div
          style={{ position: "relative", cursor: "pointer" }}
          title="Thông báo"
        >
          {/* chuông đơn giản để giữ UI tương tự */}
          <span style={{ fontSize: 18 }}>🔔</span>
          <Badge
            bg="danger"
            pill
            style={{ position: "absolute", top: -5, right: -8, fontSize: 10 }}
          >
            1
          </Badge>
        </div>

        <span
          onClick={() => navigate("/profile")}
          style={{ cursor: "pointer", fontSize: 18 }}
          title="Hồ sơ"
        >
          👤
        </span>
        <span
          onClick={handleLogout}
          style={{ cursor: "pointer", fontSize: 18 }}
          title="Đăng xuất"
        >
          ↩️
        </span>
      </div>
    </header>
  );
}
