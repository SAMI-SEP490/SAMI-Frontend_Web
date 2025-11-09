// src/layouts/PrivateLayout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/SideBar";
import { colors } from "../constants/colors";

export default function PrivateLayout() {
  const location = useLocation();

  // Danh sách các route cần ẩn Header + Sidebar
  const hideLayoutRoutes = ["/contracts/create", "/other-route-to-hide"];

  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      {!hideLayout && (
        <div
          style={{
            marginBottom: 10,
            position: "sticky",
            top: 0,
            zIndex: 1000,
            flexShrink: 0,
          }}
        >
          <Header />
        </div>
      )}

      {/* Main content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        {!hideLayout && (
          <div
            style={{
              width: "220px",
              backgroundColor: colors.brand,
              color: "white",
              height: "100%",
              borderRadius: "0 10px 10px 0",
              flexShrink: 0,
            }}
          >
            <Sidebar />
          </div>
        )}

        {/* Nội dung chính */}
        <div
          style={{
            flex: 1,
            padding: "30px",
            backgroundColor: colors.background,
            overflowY: "auto",
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
