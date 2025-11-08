import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import SideBar from "../components/SideBar";

export default function DashboardLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar bên trái */}
      <div style={{ width: 220 }}>
        <SideBar /> {/* ✅ sửa tên đúng */}
      </div>

      {/* Phần nội dung: Header + Outlet */}
      <div
        style={{
          flex: 1,
          background: "#f7f9fc",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />
        <main style={{ padding: 16, flex: 1, overflow: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
