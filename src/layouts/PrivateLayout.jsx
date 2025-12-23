// src/layouts/PrivateLayout.jsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/SideBar";
import { colors } from "../constants/colors";

export default function PrivateLayout() {
  const location = useLocation();

  // >>> NEW: Trạng thái mở/đóng Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const hideLayoutRoutes = ["/other-route-to-hide"];
  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      {!hideLayout && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            flexShrink: 0,
          }}
        >
          <Header onToggleSidebar={toggleSidebar} /> {/* <<< thêm callback */}
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        {!hideLayout &&
          isSidebarOpen && ( // <<< kiểm tra mở/đóng
            <div
              style={{
                width: "220px",
                backgroundColor: colors.brand,
                color: "white",
                height: "100%",
                borderRadius: "0 10px 10px 0",
                flexShrink: 0,
                transition: "width 0.3s",
              }}
            >
              <Sidebar toggleSidebar={toggleSidebar} /> {/* <<< truyền xuống */}
            </div>
          )}

        {/* Main */}
        <div
          style={{
            flex: 1,
            padding: "30px",
            overflowY: "auto",
            position: "relative",

            /* Background image */
            backgroundImage: "url('/background2.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
