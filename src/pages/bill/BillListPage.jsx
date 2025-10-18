import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import SideBar from "../../components/Sidebar";
import { colors } from "../../constants/colors";
import { useBillContext } from "../../contexts/BillContext";

export default function BillListPage() {
  const navigate = useNavigate();
  const { bills, setBills } = useBillContext();

  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return bills;
    return bills.filter(
      (b) =>
        b.name.toLowerCase().includes(kw) ||
        b.category.toLowerCase().includes(kw) ||
        b.period.toLowerCase().includes(kw) ||
        b.id.toLowerCase().includes(kw)
    );
  }, [bills, keyword]);

  const toggleOne = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = (checked) =>
    setSelected(checked ? new Set(filtered.map((b) => b.id)) : new Set());

  const onDelete = (id) => {
    if (!confirm(`Xóa hóa đơn ${id}?`)) return;
    setBills((prev) => prev.filter((b) => b.id !== id));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const onExport = () => {
    const header = ["ID", "Tên", "Loại", "Thời gian"];
    const rows = filtered.map((b) => [b.id, b.name, b.category, b.period]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bills.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            width: 220,
            background: colors.brand,
            color: "#fff",
            borderRadius: 10,
          }}
        >
          <SideBar />
        </div>

        <div
          style={{
            flex: 1,
            background: colors.background,
            padding: 24,
            overflow: "auto",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <button onClick={() => navigate("/tenants")} style={tab(false)}>
              Người Thuê
            </button>
            <button style={tab(true)}>Hóa Đơn</button>
          </div>

          {/* Search + Buttons */}
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: 380,
              }}
            >
              <span style={{ color: "#64748B" }}>🔎</span>
              <input
                placeholder="Tìm kiếm..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{
                  flex: 1,
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #E5E7EB",
                  background: "#F8FAFC",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={pill("#374151", "#fff")}
                onClick={() => alert("Lọc (demo)")}
              >
                Lọc
              </button>
              <button
                style={pill("#16A34A", "#fff")}
                onClick={() => alert("Tạo (demo)")}
              >
                Tạo
              </button>
              <button style={pill("#F97316", "#fff")} onClick={onExport}>
                Xuất
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 2px 10px rgba(0,0,0,.06)",
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
                  <th style={th(60)}>
                    <input
                      type="checkbox"
                      checked={
                        selected.size > 0 && selected.size === filtered.length
                      }
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th style={th()}>Tên</th>
                  <th style={th(260)}>Loại</th>
                  <th style={th(160)}>Thời Gian</th>
                  <th style={{ ...th(220), textAlign: "right" }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #EEF2F7" }}>
                    <td style={td(60)}>
                      <input
                        type="checkbox"
                        checked={selected.has(b.id)}
                        onChange={() => toggleOne(b.id)}
                      />
                    </td>
                    <td style={td()}>{b.name}</td>
                    <td style={td(260)}>{b.category}</td>
                    <td style={td(160)}>{b.period}</td>
                    <td style={{ ...td(220), textAlign: "right" }}>
                      <button
                        style={chip("#6B7280", "#fff")}
                        onClick={() => navigate(`/bills/${b.id}`)}
                      >
                        Chi Tiết
                      </button>
                      <button
                        style={chip(colors.brand, "#fff")}
                        onClick={() => alert("Sửa (demo)")}
                      >
                        Sửa
                      </button>
                      <button
                        style={chip("#DC2626", "#fff")}
                        onClick={() => onDelete(b.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#64748B",
                      }}
                    >
                      Không có dữ liệu
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

/* ---------- styles ---------- */
const tab = (active) => ({
  background: active ? colors.brand : "#fff",
  color: active ? "#fff" : "#111827",
  padding: "8px 14px",
  borderRadius: 10,
  border: active ? "none" : "1px solid #E5E7EB",
  fontWeight: 700,
  cursor: active ? "default" : "pointer",
});
const pill = (bg, fg) => ({
  background: bg,
  color: fg,
  border: "none",
  padding: "8px 16px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
});
const th = (w) => ({
  padding: "12px 16px",
  fontWeight: 700,
  color: "#334155",
  borderBottom: "1px solid #E5E7EB",
  textAlign: "left",
  width: w,
});
const td = (w) => ({ padding: "14px 16px", color: "#0F172A", width: w });
const chip = (bg, fg) => ({
  background: bg,
  color: fg,
  border: "none",
  borderRadius: 8,
  padding: "6px 12px",
  marginLeft: 8,
  cursor: "pointer",
  fontWeight: 700,
});
