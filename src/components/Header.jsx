import React, { useEffect, useState } from "react";
import { colors } from "../constants/colors";
import { useNavigate } from "react-router-dom";
import { getProfile, logout as apiLogout } from "../services/api/auth";
import { FiUser, FiLogOut, FiMenu } from "react-icons/fi";

export default function Header({ onToggleSidebar, isSidebarOpen }) {
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
      // eslint-disable-next-line no-empty
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ CHỈ GIỮ 1 displayName (FIX BUG)
  const displayName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email ||
    "Người dùng";

  const handleLogout = async () => {
    try {
      await apiLogout();
    // eslint-disable-next-line no-empty
    } catch {
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
        height: "80px",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* LEFT – Toggle sidebar */}
      <div style={{ flex: 1 }}>
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Đóng Sidebar" : "Mở Sidebar"}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          <FiMenu />
        </button>
      </div>

      {/* CENTER – Logo (GIỮ NGUYÊN) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          src="/logo2.png"
          alt="SAMI Logo"
          style={{
            height: "80px",
            objectFit: "contain",
          }}
        />
      </div>

      {/* RIGHT – User actions */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 16,
          fontSize: 14,
        }}
      >
        <span>Xin chào {displayName}!</span>

        <FiUser
          title="Hồ sơ"
          size={18}
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/profile")}
        />

        <FiLogOut
          title="Đăng xuất"
          size={18}
          style={{ cursor: "pointer" }}
          onClick={handleLogout}
        />
      </div>
    </header>
  );
}
