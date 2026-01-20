import React, { useEffect, useState } from "react";
import { colors } from "../constants/colors";
import { useNavigate } from "react-router-dom";
import { getProfile, logout as apiLogout } from "../services/api/auth";
import {
  FiUser,
  FiLogOut,
  FiMenu,
  FiChevronDown,
  FiAlertCircle,
} from "react-icons/fi";
import { useClosingAlert } from "../hooks/useClosingAlert"; // Import Hook
import { ROUTES } from "../constants/routes";

// eslint-disable-next-line no-unused-vars
export default function Header({ onToggleSidebar }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sami:user") || "null");
    } catch {
      return null;
    }
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();

  // Sử dụng Hook để check cảnh báo
  const { alertCount } = useClosingAlert(user);

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

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email ||
    "Người dùng";
  const { avatar_url, full_name } = user;
  const avatarSrc =
    avatar_url ||
    `https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=256&name=${encodeURIComponent(
      full_name || "User",
    )}`;

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
      window.dispatchEvent(new Event("sami:auth"));
      navigate("/login", { replace: true });
    }
  };

  return (
    <header
      style={{
        background: `linear-gradient(135deg, ${colors.brand} 0%, ${colors.brand}dd 100%)`,
        color: "#fff",
        height: "70px",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* LEFT – Toggle sidebar + Logo (Giữ nguyên) */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <button
          onClick={onToggleSidebar}
          className="header-toggle-btn"
          style={{
            /* style cũ */ background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            color: "#fff",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <FiMenu size={20} />
        </button>
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
        >
          <img
            src="/logo2.png"
            alt="SAMI Logo"
            style={{
              height: "50px",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            }}
          />
        </div>
      </div>

      {/* RIGHT – User section */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* VIÊN THUỐC CẢNH BÁO */}
        {alertCount > 0 && (
          <div
            onClick={() => navigate(ROUTES.utilityServices)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#FEE2E2", // Nền đỏ nhạt
              color: "#DC2626", // Chữ đỏ đậm
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "transform 0.2s",
              animation: "pulse 2s infinite", // Hiệu ứng nhịp đập nhẹ (tùy chọn)
            }}
            title="Có tòa nhà cần chốt sổ điện nước!"
          >
            <FiAlertCircle size={16} />
            <span>Chốt sổ ({alertCount})</span>
          </div>
        )}

        {/* User Dropdown Trigger (Giữ nguyên logic cũ nhưng bọc lại) */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            className="header-user-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "24px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <img
              src={avatarSrc}
              alt="Avatar"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            />
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </span>
            <FiChevronDown
              size={16}
              style={{
                transition: "transform 0.2s ease",
                transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>

          {/* Dropdown Menu (Giữ nguyên) */}
          {showDropdown && (
            <>
              {/* Overlay & Dropdown Content... (Copy y nguyên code cũ vào đây) */}
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  minWidth: "200px",
                  overflow: "hidden",
                  zIndex: 1001,
                }}
              >
                <div
                  className="dropdown-item"
                  onClick={() => {
                    navigate("/profile");
                    setShowDropdown(false);
                  }}
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    color: "#333",
                  }}
                >
                  <FiUser size={18} color={colors.brand} />
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    Hồ sơ cá nhân
                  </span>
                </div>
                <div
                  style={{
                    height: "1px",
                    background: "#e5e5e5",
                    margin: "4px 0",
                  }}
                />
                <div
                  className="dropdown-item logout"
                  onClick={() => {
                    handleLogout();
                    setShowDropdown(false);
                  }}
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    color: "#dc2626",
                  }}
                >
                  <FiLogOut size={18} />
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    Đăng xuất
                  </span>
                </div>
              </div>
              <div
                onClick={() => setShowDropdown(false)}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                }}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
