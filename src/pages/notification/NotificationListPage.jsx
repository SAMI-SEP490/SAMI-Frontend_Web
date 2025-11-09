import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { NotificationContext } from "../../contexts/NotificationContext";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function NotificationListPage() {
  const navigate = useNavigate();
  const { notificationData, setNotificationData } =
    useContext(NotificationContext);

  const [statusFilter, setStatusFilter] = useState("all");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return (notificationData || []).filter((n) => {
      const byStatus =
        statusFilter === "all" ||
        n.status.toLowerCase() === statusFilter.toLowerCase();
      const byKw =
        kw === "" ||
        n.title.toLowerCase().includes(kw) ||
        n.category.toLowerCase().includes(kw) ||
        n.building.toLowerCase().includes(kw);
      return byStatus && byKw;
    });
  }, [notificationData, statusFilter, keyword]);

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thông báo này không?")) {
      setNotificationData((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const cell = { padding: "12px 16px", color: "#0F172A" };
  const iconBtn = {
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 16,
    marginRight: 12,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: "24px",
        overflowY: "auto",
      }}
    >
      {/* Tiêu đề */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
          Danh Sách Thông Báo / Quy Định
        </h2>
        <div>
          <button
            onClick={() => navigate("/notifications/create")}
            style={{
              background: "#059669",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Tạo Thông Báo Mới
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          borderRadius: 10,
          padding: "12px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,.05)",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#334155" }}>Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "6px 10px",
              minWidth: 120,
              background: "#fff",
            }}
          >
            <option value="all">Tất cả</option>
            <option value="Đã gửi">Đã gửi</option>
            <option value="Nháp">Nháp</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#334155" }}>Tìm kiếm:</span>
          <input
            placeholder="Nhập tiêu đề hoặc danh mục"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "8px 10px",
              width: 300,
            }}
          />
          <button
            style={{
              background: colors.brand,
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            Tìm
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 10px rgba(0,0,0,.06)",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead style={{ background: "#F1F5F9" }}>
            <tr>
              {[
                "#",
                "Tiêu đề",
                "Danh mục",
                "Ngày hiệu lực",
                "Ngày hết hạn",
                "Tòa nhà",
                "Trạng thái",
                "Hành động",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    color: "#334155",
                    fontWeight: 700,
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((n, index) => (
              <tr key={n.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={cell}>{index + 1}</td>
                <td style={cell}>{n.title}</td>
                <td style={cell}>{n.category}</td>
                <td style={cell}>{n.effectiveDate}</td>
                <td style={cell}>{n.expiryDate}</td>
                <td style={cell}>{n.building}</td>
                <td style={cell}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontWeight: 700,
                      color: n.status === "Đã gửi" ? "#059669" : "#DC2626",
                      background:
                        n.status === "Đã gửi"
                          ? "#ECFDF5"
                          : "rgba(220,38,38,0.1)",
                    }}
                  >
                    {n.status}
                  </span>
                </td>
                <td style={{ ...cell }}>
                  {n.status === "Nháp" && (
                    <>
                      <button
                        style={{ ...iconBtn, color: "#0F3D8A" }}
                        onClick={() => navigate(`/notifications/${n.id}/edit`)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        style={{ ...iconBtn, color: "#DC2626" }}
                        onClick={() => handleDelete(n.id)}
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#64748B",
                  }}
                >
                  Không có dữ liệu phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
