import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { UserContext } from "../../contexts/UserContext";
import { ContractContext } from "../../contexts/ContractContext";

export default function TenantListPage() {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);
  const { contractData } = useContext(ContractContext);

  // chỉ lấy người dùng có vai trò "Người thuê trọ"
  const tenants = useMemo(
    () => (userData || []).filter((u) => u.role === "Người thuê trọ"),
    [userData]
  );

  // ghép số phòng/contract từ ContractContext
  const rows = useMemo(() => {
    return tenants.map((t) => {
      const ct = (contractData || []).find(
        (c) => String(c.tenantId) === String(t.id)
      );
      return {
        id: t.id,
        name: t.full_name,
        email: t.email,
        phone: t.phone || "—",
        room: ct?.room ?? "—",
        avatar: t.avatar_url,
      };
    });
  }, [tenants, contractData]);

  // filter phòng + search
  const [roomFilter, setRoomFilter] = useState("all");
  const [keyword, setKeyword] = useState("");

  const roomOptions = useMemo(() => {
    const set = new Set((contractData || []).map((c) => c.room));
    return [
      "all",
      ...Array.from(set).sort((a, b) => String(a).localeCompare(String(b))),
    ];
  }, [contractData]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const byRoom =
        roomFilter === "all" || String(r.room) === String(roomFilter);
      const kw = keyword.trim().toLowerCase();
      const byKw =
        kw === "" ||
        r.name.toLowerCase().includes(kw) ||
        r.email.toLowerCase().includes(kw) ||
        String(r.phone).toLowerCase().includes(kw);
      return byRoom && byKw;
    });
  }, [rows, roomFilter, keyword]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header cố định ở trên */}
      <div
        style={{
          marginBottom: 10,
          borderRadius: "10px",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        {" "}
        <Header />{" "}
      </div>
      ```
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar trái */}
        <div
          style={{
            width: "220px",
            backgroundColor: colors.brand,
            color: "white",
            height: "100%",
            position: "sticky",
            top: 0,
            borderRadius: "10px",
          }}
        >
          <Sidebar />
        </div>

        {/* Nội dung */}
        <div
          style={{
            flex: 1,
            background: colors.background,
            padding: "24px",
            overflowY: "auto",
          }}
        >
          {/* Tiêu đề */}
          <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
            Danh Sách Người Thuê
          </h2>

          {/* Hàng filter */}
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
            {/* Lọc theo phòng */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#334155" }}>Số phòng</span>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: "6px 10px",
                  minWidth: 120,
                  background: "#fff",
                }}
              >
                {roomOptions.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? "Tất cả" : r}
                  </option>
                ))}
              </select>
            </div>

            {/* Ô tìm kiếm và nút hành động */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#334155" }}>Tìm kiếm:</span>
              <input
                placeholder="Nhập tên / email / SĐT"
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
                onClick={() => setKeyword(keyword.trim())}
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

              {/* 👉 Nút Đăng ký người thuê trọ */}
              <button
                onClick={() => navigate("/tenants/create")}
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
                + Đăng ký người thuê trọ
              </button>
            </div>
          </div>

          {/* Bảng */}
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
                    "ID",
                    "Ảnh Đại Diện",
                    "Tên",
                    "Số phòng",
                    "Email",
                    "Số điện thoại",
                    "Hành Động",
                  ].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        textAlign: i === 1 || i === 6 ? "center" : "left",
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
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={cell}> {r.id} </td>
                    <td style={{ ...cell, textAlign: "center" }}>
                      <img
                        src={r.avatar || "https://i.pravatar.cc/60?img=12"}
                        alt="avatar"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    </td>
                    <td style={cell}> {r.name} </td>
                    <td style={cell}> {r.room} </td>
                    <td style={cell}> {r.email} </td>
                    <td style={cell}> {r.phone} </td>
                    <td style={{ ...cell, textAlign: "center" }}>
                      <button
                        onClick={() => navigate(`/tenants/${r.id}`)}
                        style={linkBtn}
                      >
                        Xem chi tiết
                      </button>
                      <button
                        style={outlineBtn}
                        onClick={() => navigate(`/tenants/${r.id}/edit`)}
                      >
                        Sửa
                      </button>
                      <button
                        style={dangerBtn}
                        onClick={() => alert("Xóa (demo)")}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
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
      </div>
    </div>
  );
}

const cell = { padding: "12px 16px", color: "#0F172A" };

const linkBtn = {
  background: "none",
  border: "none",
  color: "#0F3D8A",
  fontWeight: 700,
  marginRight: 12,
  cursor: "pointer",
};

const outlineBtn = {
  border: "1px solid #CBD5E1",
  background: "#fff",
  color: "#111827",
  padding: "6px 12px",
  borderRadius: 8,
  marginRight: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const dangerBtn = {
  border: "none",
  background: "#DC2626",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};
