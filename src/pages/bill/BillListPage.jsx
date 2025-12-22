// src/pages/bill/BillListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash } from "react-bootstrap-icons";
import { listBills, deleteOrCancelBill } from "../../services/api/bills";
import { http } from "../../services/http";
import "./BillListPage.css";

/* ================= Helpers (GIỮ NGUYÊN) ================= */
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
  for (const [m, c] of count.entries()) {
    if (c > days) {
      days = c;
      best = m;
    }
  }
  return `Hóa đơn tháng ${best}`;
}

const getCreatedAt = (b) =>
  b.created_at || b.createdAt || b.created_date || b.created || b.createdOn;

const getRoomId = (b) => b.room_id ?? b.roomId ?? b.room?.id ?? b.room?.room_id;

const getBillId = (b) => b.id ?? b.bill_id ?? b.billId ?? b?.bill?.id;

function getRoomLabel(roomsMap, bill) {
  const id = getRoomId(bill);
  if (id == null) return "—";
  return roomsMap.get(Number(id)) || `Phòng ${id}`;
}

function getPaidInfo(b) {
  const status = String(
    b.status || b.bill_status || b.payment_status || ""
  ).toLowerCase();

  const flag =
    Boolean(b.is_paid ?? b.paid ?? b.isPaid) ||
    ["paid", "completed", "settled"].includes(status);

  const totalPaid = Number(b.total_paid ?? b.amount_paid ?? 0);
  const totalAmt = Number(b.total_amount ?? b.amount ?? 0);

  const isPaid =
    flag ||
    (Number.isFinite(totalPaid) &&
      Number.isFinite(totalAmt) &&
      totalAmt > 0 &&
      totalPaid >= totalAmt);

  return { isPaid, label: isPaid ? "Đã thanh toán" : "Chưa thanh toán" };
}

/* ================= Page ================= */
export default function BillListPage() {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [roomsMap, setRoomsMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roomFilter, setRoomFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selected, setSelected] = useState(new Set());

  /* ================= Fetch ================= */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const list = await listBills();
        setBills(Array.isArray(list) ? list : []);

        const res = await http.get("/room/all", {
          validateStatus: () => true,
        });

        const map = new Map();
        (res?.data || []).forEach((r) => {
          const id = Number(r.id ?? r.room_id);
          const label = r.room_number ?? r.name ?? `Phòng ${id}`;
          if (Number.isFinite(id)) map.set(id, label);
        });
        setRoomsMap(map);
      } catch {
        setError("Không tải được danh sách hóa đơn.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ================= Filter ================= */
  const filteredBills = useMemo(() => {
    const start = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const end = toDate ? new Date(toDate + "T23:59:59") : null;

    return bills.filter((b) => {
      if (roomFilter !== "all" && Number(getRoomId(b)) !== Number(roomFilter))
        return false;
      const created = parseDate(getCreatedAt(b));
      if (start && (!created || created < start)) return false;
      if (end && (!created || created > end)) return false;
      return true;
    });
  }, [bills, roomFilter, fromDate, toDate]);

  const toggleAll = (checked) =>
    setSelected(checked ? new Set(filteredBills.map(getBillId)) : new Set());

  const toggleOne = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  async function onDelete(id) {
    if (!window.confirm("Xóa hóa đơn này?")) return;
    await deleteOrCancelBill(id);
    setBills((prev) => prev.filter((b) => getBillId(b) !== id));
  }

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Danh sách hóa đơn</h2>

      {/* FILTER + ACTION */}
      <div className="filter-bar grid">
        <select
          className="status-select"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        >
          <option value="all">Tất cả phòng</option>
          {[...roomsMap.entries()].map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="search-input"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <input
          type="date"
          className="search-input"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button className="btn add" onClick={() => navigate("/bills/create")}>
          + Tạo hóa đơn
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="center">
                <input
                  type="checkbox"
                  checked={
                    selected.size > 0 && selected.size === filteredBills.length
                  }
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th className="center">#</th>
              <th className="center">Phòng</th>
              <th>Tên hóa đơn</th>
              <th className="center">Ngày tạo</th>
              <th className="center">Trạng thái</th>
              <th className="center action-col">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {error && (
              <tr>
                <td colSpan={7} className="center">
                  {error}
                </td>
              </tr>
            )}

            {filteredBills.map((b, i) => {
              const id = getBillId(b);
              const paid = getPaidInfo(b);

              return (
                <tr key={id}>
                  <td className="center">
                    <input
                      type="checkbox"
                      checked={selected.has(id)}
                      onChange={() => toggleOne(id)}
                    />
                  </td>
                  <td className="center">{i + 1}</td>
                  <td className="center">{getRoomLabel(roomsMap, b)}</td>
                  <td>
                    {monthLabelFromPeriod(
                      b.billing_period_start,
                      b.billing_period_end
                    )}
                  </td>
                  <td className="center">
                    {fmtVN(parseDate(getCreatedAt(b)))}
                  </td>
                  <td className="center">
                    <span
                      className={`status ${
                        paid.isPaid ? "published" : "archived"
                      }`}
                    >
                      {paid.label}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button
                      className="btn view"
                      onClick={() => navigate(`/bills/${id}`)}
                    >
                      <Eye size={14} /> Xem
                    </button>

                    <button className="btn delete" onClick={() => onDelete(id)}>
                      <Trash size={14} /> Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredBills.length === 0 && (
          <p className="no-data">Không có hóa đơn nào.</p>
        )}
      </div>
    </div>
  );
}
