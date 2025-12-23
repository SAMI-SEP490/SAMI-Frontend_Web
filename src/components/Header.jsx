import React, { useEffect, useState } from "react";
import { colors } from "../constants/colors";
import { useNavigate } from "react-router-dom";
import { getProfile, logout as apiLogout } from "../services/api/auth";
import { FiUser, FiLogOut, FiMenu, FiChevronDown } from "react-icons/fi";

export default function Header({ onToggleSidebar, isSidebarOpen }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sami:user") || "null");
    } catch {
      return null;
    }
  });
  const [showDropdown, setShowDropdown] = useState(false);

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

    const displayName =
        user?.full_name ||
        user?.name ||
        user?.username ||
        user?.email ||
        "Người dùng";
    const { avatar_url, full_name} =
        user;
    const avatarSrc =
        avatar_url ||
        `https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=256&name=${encodeURIComponent(
            full_name || "User"
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
      {/* LEFT – Toggle sidebar + Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Đóng Sidebar" : "Mở Sidebar"}
          className="header-toggle-btn"
          style={{
            background: "rgba(255,255,255,0.1)",
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <FiMenu size={20} />
        </button>

        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
          title="Về trang chủ"
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

            {/* RIGHT – User section with dropdown */}
            <div
                style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                }}
            >
                {/* User Dropdown Trigger */}
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
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    }}
                >
                    {/* Avatar Circle */}
                    <div
                    >
                        <img
                            src={avatarSrc}
                            alt="Avatar"
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "600",
                                fontSize: "14px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                        />
                    </div>

          {/* User Name */}
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

          {/* Dropdown Icon */}
          <FiChevronDown
            size={16}
            style={{
              transition: "transform 0.2s ease",
              transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            <style>
              {`
                @keyframes slideDown {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                .dropdown-item {
                  padding: 12px 16px;
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  cursor: pointer;
                  transition: background 0.2s ease;
                  color: #333;
                }
                .dropdown-item:hover {
                  background: #f5f5f5;
                }
                .dropdown-item.logout:hover {
                  background: #fff0f0;
                }
              `}
            </style>

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
                animation: "slideDown 0.2s ease",
              }}
            >
              {/* Profile Option */}
              <div
                className="dropdown-item"
                onClick={() => {
                  navigate("/profile");
                  setShowDropdown(false);
                }}
              >
                <FiUser size={18} color={colors.brand} />
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  Hồ sơ cá nhân
                </span>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  background: "#e5e5e5",
                  margin: "4px 0",
                }}
              />

              {/* Logout Option */}
              <div
                className="dropdown-item logout"
                onClick={() => {
                  handleLogout();
                  setShowDropdown(false);
                }}
              >
                <FiLogOut size={18} color="#dc2626" />
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  Đăng xuất
                </span>
              </div>
            </div>

            {/* Click outside overlay to close dropdown */}
            <div
              onClick={() => setShowDropdown(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
              }}
            />
          </>
        )}
      </div>
    </header>
  );
}
