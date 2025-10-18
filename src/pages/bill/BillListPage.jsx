import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import SideBar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { useBillContext } from "../../contexts/BillContext";

const CATEGORY_OPTS = ["Chi phí sinh hoạt", "Dịch vụ"];
const PERIOD_OPTS = ["Một tháng", "Một tuần", "Một ngày"];

export default function BillListPage() {
  const navigate = useNavigate();
  const { bills, setBills } = useBillContext();

  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(new Set());

  // --- NEW: state cho modal Tạo ---
  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    category: CATEGORY_OPTS[0],
    period: PERIOD_OPTS[0],
  });

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

  // --- NEW: tạo hóa đơn ---
  const handleCreate = () => {
    if (!createForm.name.trim()) {
      alert("Vui lòng nhập tên hóa đơn");
      return;
    }
    const maxNum = bills
      .map((b) => parseInt(String(b.id).replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n))
      .reduce((a, b) => Math.max(a, b), 0);
    const newId = `BL-${String(maxNum + 1).padStart(3, "0")}`;

    const nowISO = new Date().toISOString();
    const newBill = {
      id: newId,
      name: createForm.name.trim(),
      category: createForm.category,
      period: createForm.period,
      createdAt: nowISO,
    };
    setBills((prev) => [newBill, ...prev]); // thêm đầu danh sách
    setOpenCreate(false);
    setCreateForm({
      name: "",
      category: CATEGORY_OPTS[0],
      period: PERIOD_OPTS[0],
    });
  };
  // --- EDIT MODAL state ---
  const [openEdit, setOpenEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    category: CATEGORY_OPTS[0],
    period: PERIOD_OPTS[0],
    createdAt: "", // hiển thị readonly
  });

  // mở modal sửa với dữ liệu đang chọn
  const openEditBill = (bill) => {
    setEditForm({
      id: bill.id,
      name: bill.name,
      category: bill.category,
      period: bill.period,
      createdAt: bill.createdAt || new Date().toISOString(),
    });
    setOpenEdit(true);
  };

  // cập nhật bill vào context
  const handleUpdate = () => {
    if (!editForm.name.trim()) {
      alert("Vui lòng nhập tên hóa đơn");
      return;
    }
    setBills((prev) =>
      prev.map((b) =>
        b.id === editForm.id
          ? {
              ...b,
              name: editForm.name.trim(),
              category: editForm.category,
              period: editForm.period,
              // createdAt giữ nguyên (đang readonly)
            }
          : b
      )
    );
    setOpenEdit(false);
  };

  // util format ngày giờ kiểu VN
  const formatVNDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return (
      d.toLocaleDateString("vi-VN") +
      " " +
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
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
                placeholder="Tìm kiếm…"
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
              {/* Nút TẠO mở modal */}
              <button
                style={pill("#16A34A", "#fff")}
                onClick={() => setOpenCreate(true)}
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
                        onClick={() => openEditBill(b)} // 👈 mở modal sửa
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

          {/* ====== NEW: Modal TẠO HÓA ĐƠN ====== */}
          {openCreate && (
            <div style={backdrop} onClick={() => setOpenCreate(false)}>
              <div style={modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={modalHeader}>
                  <div style={{ fontWeight: 700 }}>Tạo Hóa Đơn</div>
                  <button style={closeX} onClick={() => setOpenCreate(false)}>
                    ×
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
                  <Field label="Tên:">
                    <input
                      placeholder="VD: Tiền nước"
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, name: e.target.value }))
                      }
                      style={input}
                    />
                  </Field>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <Field label="Loại:">
                      <select
                        value={createForm.category}
                        onChange={(e) =>
                          setCreateForm((f) => ({
                            ...f,
                            category: e.target.value,
                          }))
                        }
                        style={select}
                      >
                        {CATEGORY_OPTS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Thời gian:">
                      <select
                        value={createForm.period}
                        onChange={(e) =>
                          setCreateForm((f) => ({
                            ...f,
                            period: e.target.value,
                          }))
                        }
                        style={select}
                      >
                        {PERIOD_OPTS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                {/* Footer */}
                <div style={modalFooter}>
                  <button
                    style={pill("#9CA3AF", "#fff")}
                    onClick={() => setOpenCreate(false)}
                  >
                    Đóng
                  </button>
                  <button
                    style={pill("#1E40AF", "#fff")}
                    onClick={handleCreate}
                  >
                    Tạo
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ====== /Modal ====== */}

          {/* ====== Modal CẬP NHẬT HÓA ĐƠN ====== */}
          {openEdit && (
            <div style={backdrop} onClick={() => setOpenEdit(false)}>
              <div style={modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={modalHeader}>
                  <div style={{ fontWeight: 700 }}>Cập Nhật Hóa Đơn</div>
                  <button style={closeX} onClick={() => setOpenEdit(false)}>
                    ×
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
                  <Field label="Tên:">
                    <input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, name: e.target.value }))
                      }
                      style={input}
                    />
                  </Field>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <Field label="Ngày tạo:">
                      <input
                        value={formatVNDateTime(editForm.createdAt)}
                        style={input}
                        disabled
                      />
                    </Field>
                    <span /> {/* filler để canh lưới cho đẹp */}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <Field label="Loại:">
                      <select
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            category: e.target.value,
                          }))
                        }
                        style={select}
                      >
                        {CATEGORY_OPTS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Thời gian:">
                      <select
                        value={editForm.period}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, period: e.target.value }))
                        }
                        style={select}
                      >
                        {PERIOD_OPTS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                {/* Footer */}
                <div style={modalFooter}>
                  <button
                    style={pill("#9CA3AF", "#fff")}
                    onClick={() => setOpenEdit(false)}
                  >
                    Đóng
                  </button>
                  <button
                    style={pill("#1E40AF", "#fff")}
                    onClick={handleUpdate}
                  >
                    Cập Nhật
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ====== /Modal CẬP NHẬT ====== */}
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

// Modal styles
const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};
const modal = {
  width: 560,
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 20px 60px rgba(0,0,0,.25)",
  overflow: "hidden",
};
const modalHeader = {
  padding: "14px 20px",
  borderBottom: "1px solid #EEF2F7",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const modalFooter = {
  padding: "12px 20px",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  borderTop: "1px solid #EEF2F7",
};
const closeX = {
  background: "none",
  border: "none",
  fontSize: 24,
  lineHeight: 1,
  cursor: "pointer",
  color: "#94A3B8",
};
const Field = ({ label, children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "120px 1fr",
      alignItems: "center",
      gap: 10,
    }}
  >
    <div style={{ color: "#334155" }}>{label}</div>
    <div>{children}</div>
  </div>
);
const input = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#F8FAFC",
};
const select = {
  width: "100%",
  height: 40,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#F8FAFC",
};
