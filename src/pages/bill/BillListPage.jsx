import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { listBills, deleteOrCancelBill } from "../../services/api/bills";
import { http } from "../../services/http";

/* ================= Helpers ================= */
function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function fmtVN(dt) {
  if (!dt) return "—";
  return (
    dt.toLocaleDateString("vi-VN") +
    " " +
    dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}
/** Đặt tên hóa đơn theo tháng có số ngày nhiều nhất trong kỳ */
function monthLabelFromPeriod(startISO, endISO) {
  const s = parseDate(startISO);
  const e = parseDate(endISO);
  if (!s || !e || s >= e) {
    const fallback = (s || e || new Date()).getMonth() + 1;
    return `Hóa đơn tháng ${fallback}`;
  }
  const count = new Map();
  const d = new Date(s);
  while (d < e) {
    const key = d.getMonth() + 1;
    count.set(key, (count.get(key) || 0) + 1);
    d.setDate(d.getDate() + 1);
  }
  let best = s.getMonth() + 1,
    days = -1;
  for (const [m, c] of count.entries())
    if (c > days) {
      days = c;
      best = m;
    }
  return `Hóa đơn tháng ${best}`;
}
function getCreatedAt(b) {
  return (
    b.created_at || b.createdAt || b.created_date || b.created || b.createdOn
  );
}
function getRoomId(b) {
  return b.room_id ?? b.roomId ?? b.room?.id ?? b.room?.room_id;
}
function getBillId(b) {
  return b.id ?? b.bill_id ?? b.billId ?? b?.bill?.id;
}
/** Lấy nhãn phòng từ map; fallback “Phòng {id}” */
function getRoomLabel(roomsMap, bill) {
  const id = getRoomId(bill);
  if (id == null) return "—";
  return roomsMap.get(Number(id)) || `Phòng ${id}`;
}
/** SUY RA TRẠNG THÁI thanh toán từ nhiều schema khác nhau */
function getPaidInfo(b) {
  const status = String(
    b.status || b.bill_status || b.payment_status || ""
  ).toLowerCase();
  const flag =
    Boolean(b.is_paid ?? b.paid ?? b.isPaid) ||
    ["paid", "completed", "settled"].includes(status);

  const totalPaid = Number(b.total_paid ?? b.amount_paid ?? b.paid_amount ?? 0);
  const totalAmt = Number(b.total_amount ?? b.amount ?? 0);
  const calcPaid =
    Number.isFinite(totalPaid) &&
    Number.isFinite(totalAmt) &&
    totalAmt > 0 &&
    totalPaid >= totalAmt;

  const isPaid = flag || calcPaid;
  return { isPaid, label: isPaid ? "Đã thanh toán" : "Chưa thanh toán" };
}

/* ================= Page ================= */
export default function BillListPage() {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [roomsMap, setRoomsMap] = useState(new Map()); // id -> label
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [roomFilter, setRoomFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // selection
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) Bills
        const list = await listBills();
        setBills(Array.isArray(list) ? list : []);

        // 2) Rooms for filter/label
        const res = await http.get("/room/all", { validateStatus: () => true });
        const data = res?.data;
        const map = new Map();
        if (Array.isArray(data)) {
          data.forEach((r) => {
            const id = Number(r.id ?? r.room_id);
            const name =
              r.name ??
              r.room_number ??
              r.number ??
              (id ? `Phòng ${id}` : "Phòng");
            if (Number.isFinite(id)) map.set(id, String(name));
          });
        }
        setRoomsMap(map);
      } catch (e) {
        setErr(e?.message || "Không tải được dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const start = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const end = toDate ? new Date(toDate + "T23:59:59") : null;

    return bills.filter((b) => {
      if (roomFilter) {
        const rid = Number(roomFilter);
        if (Number(getRoomId(b)) !== rid) return false;
      }
      const created = parseDate(getCreatedAt(b));
      if (start && (!created || created < start)) return false;
      if (end && (!created || created > end)) return false;
      return true;
    });
  }, [bills, roomFilter, fromDate, toDate]);

  const toggleOne = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAll = (checked) =>
    setSelected(
      checked ? new Set(filtered.map((b) => getBillId(b))) : new Set()
    );

  async function onDelete(id) {
    if (!window.confirm("Xoá hoá đơn này?")) return;
    try {
      await deleteOrCancelBill(id);
      setBills((prev) =>
        prev.filter((b) => String(getBillId(b)) !== String(id))
      );
      setSelected((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    } catch (e) {
      alert(e?.message || "Xoá hoá đơn thất bại");
    }
  }

  return (
    <div
      style={{ padding: 24, background: colors.background, minHeight: "100vh" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontWeight: 800, color: "#0F172A" }}>
          Danh sách hoá đơn
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/bills/create")}
            style={{ borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}
          >
            + Tạo hoá đơn
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          display: "grid",
          gridTemplateColumns: "220px 180px 180px 1fr",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>
            Phòng
          </div>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            style={select}
          >
            <option value="">Tất cả phòng</option>
            {[...roomsMap.entries()].map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>
            Ngày tạo (từ)
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={input}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>
            Ngày tạo (đến)
          </div>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={input}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="btn btn-light"
            onClick={() => {
              setRoomFilter("");
              setFromDate("");
              setToDate("");
            }}
            style={{ borderRadius: 10, padding: "8px 12px" }}
          >
            Xoá bộ lọc
          </button>
        </div>
      </div>

      {/* Error/Loading */}
      {err && (
        <div
          className="alert alert-danger"
          role="alert"
          style={{ borderRadius: 10 }}
        >
          {err}
        </div>
      )}
      {loading ? (
        <div style={{ padding: 24 }}>Đang tải…</div>
      ) : (
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
                <th style={th(70)}>STT</th>
                <th style={th(140)}>Phòng</th>
                <th style={th()}>Tên hoá đơn</th>
                <th style={th(220)}>Ngày tạo</th>
                <th style={th(160)}>Trạng thái</th>
                <th style={{ ...th(260), textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, idx) => {
                const billId = getBillId(b);
                const createdAt = parseDate(getCreatedAt(b));
                const name = monthLabelFromPeriod(
                  b.billing_period_start,
                  b.billing_period_end
                );
                const roomLabel = getRoomLabel(roomsMap, b);
                const paid = getPaidInfo(b);

                return (
                  <tr
                    key={billId ?? `row-${idx}`}
                    style={{ borderBottom: "1px solid #EEF2F7" }}
                  >
                    <td style={td(60)}>
                      <input
                        type="checkbox"
                        checked={selected.has(billId)}
                        onChange={() => toggleOne(billId)}
                      />
                    </td>
                    <td style={td(70)}>{idx + 1}</td>
                    <td style={td(140)}>{roomLabel}</td>
                    <td style={td()}>{name}</td>
                    <td style={td(220)}>{fmtVN(createdAt)}</td>
                    <td style={td(160)}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 40,
                          fontWeight: 700,
                          color: paid.isPaid ? "#065F46" : "#7C2D12",
                          background: paid.isPaid ? "#D1FAE5" : "#FEE2E2",
                        }}
                      >
                        {paid.label}
                      </span>
                    </td>
                    <td style={{ ...td(260), textAlign: "right" }}>
                      <button
                        style={chip("#6B7280", "#fff")}
                        onClick={() => billId && navigate(`/bills/${billId}`)}
                        disabled={!billId}
                      >
                        Chi tiết
                      </button>
                      <button
                        style={chip(colors.brand, "#fff")}
                        onClick={() =>
                          billId &&
                          navigate(`/bills/${billId}/edit`, {
                            state: { edit: true },
                          })
                        }
                        disabled={!billId}
                      >
                        Sửa
                      </button>
                      <button
                        style={chip("#DC2626", "#fff")}
                        onClick={() => billId && onDelete(billId)}
                        disabled={!billId}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                );
              })}
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
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** ============== styles ============== */
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
