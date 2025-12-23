import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash, Pencil, Send } from "react-bootstrap-icons";
import {
  listBills,
  listDraftBills,
  deleteOrCancelBill,
  updateDraftBill,
} from "../../services/api/bills";
import { http, unwrap as un } from "../../services/http";
import "./BillListPage.css";

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
const getRoomLabel = (bill, roomsMap) => {
  const roomId = getRoomId(bill);
  if (!roomId) return "—";
  return roomsMap.get(Number(roomId)) || "Phòng ?";
};

const getBillId = (b) => b.id ?? b.bill_id ?? b.billId;

/* ====== CHỈ 3 TRẠNG THÁI UI ====== */
function renderStatusBadge(bill) {
  const status = String(bill?.status || "").toLowerCase();

  if (status === "draft") return <span className="status draft">Nháp</span>;
  if (status === "paid")
    return <span className="status paid">Đã thanh toán</span>;

  // issued / overdue / partially_paid
  return <span className="status unpaid">Chưa thanh toán</span>;
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

  /* ================= Fetch ================= */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [issuedRes, draftRes] = await Promise.allSettled([
          listBills(),
          listDraftBills(),
        ]);

        const issued = issuedRes.status === "fulfilled" ? issuedRes.value : [];
        const drafts = draftRes.status === "fulfilled" ? draftRes.value : [];

        if (issuedRes.status === "rejected" && draftRes.status === "rejected") {
          throw new Error("Không tải được danh sách hóa đơn.");
        }

        const map = new Map();
        [...drafts, ...issued].forEach((b) => {
          const id = getBillId(b);
          if (id != null) map.set(String(id), b);
        });

        if (!cancelled) setBills([...map.values()]);

        // load rooms (fail cũng không phá list)
        try {
          let res = await http.get("/room", { validateStatus: () => true });
          let data = un(res);
          let items = Array.isArray(data) ? data : data?.items ?? data?.data;

          if (!items) {
            res = await http.get("/room/all", { validateStatus: () => true });
            data = un(res);
            items = Array.isArray(data) ? data : data?.items ?? data?.data;
          }

          const roomMap = new Map();
          (items || []).forEach((r) => {
            const id = Number(r.id ?? r.room_id);
            const label = r.room_number ?? r.name ?? `Phòng ${id}`;
            if (Number.isFinite(id)) roomMap.set(id, label);
          });
          if (!cancelled) setRoomsMap(roomMap);
          // eslint-disable-next-line no-empty
        } catch {}
      } catch (e) {
        if (!cancelled)
          setError(e?.message || "Không tải được danh sách hóa đơn.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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

  async function onPublish(id) {
    const bill = bills.find((b) => getBillId(b) === id);
    if (!bill) return;

    await updateDraftBill(id, {
      status: "issued",
      room_id: bill.room_id,
      tenant_user_id: bill.tenant_user_id,
      billing_period_start: bill.billing_period_start,
      billing_period_end: bill.billing_period_end,
      due_date: bill.due_date,
      total_amount: bill.total_amount,
      description: bill.description,
      penalty_amount: bill.penalty_amount,
    });

    setBills((prev) =>
      prev.map((b) => (getBillId(b) === id ? { ...b, status: "issued" } : b))
    );
  }

  async function onDelete(id) {
    if (!window.confirm("Xóa hóa đơn nháp này?")) return;
    await deleteOrCancelBill(id);
    setBills((prev) => prev.filter((b) => getBillId(b) !== id));
  }

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Danh sách hóa đơn</h2>

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

        <button
          type="button"
          className="btn add"
          onClick={() => navigate("/bills/create")}
        >
          + Tạo hóa đơn
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Phòng</th>
              <th>Tên hóa đơn</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {error && filteredBills.length === 0 && (
              <tr>
                <td colSpan={6} className="center">
                  {error}
                </td>
              </tr>
            )}

            {filteredBills.map((b, i) => {
              const id = getBillId(b);
              const status = String(b.status || "").toLowerCase();

              return (
                <tr key={id}>
                  <td className="center">{i + 1}</td>

                  {/* ✅ PHÒNG: dùng room_number, không dùng room_id */}
                  <td className="center">{getRoomLabel(b, roomsMap)}</td>

                  <td>
                    {monthLabelFromPeriod(
                      b.billing_period_start,
                      b.billing_period_end
                    )}
                  </td>

                  <td>{fmtVN(parseDate(getCreatedAt(b)))}</td>

                  <td>{renderStatusBadge(b)}</td>

                  <td className="action-buttons">
                    <button
                      type="button"
                      className="btn view"
                      onClick={() => navigate(`/bills/${id}`)}
                    >
                      <Eye size={14} /> Xem
                    </button>

                    {status === "draft" && (
                      <>
                        <button
                          type="button"
                          className="btn edit"
                          onClick={() => navigate(`/bills/${id}/edit`)}
                        >
                          <Pencil size={14} /> Sửa
                        </button>

                        <button
                          type="button"
                          className="btn publish"
                          onClick={() => onPublish(id)}
                        >
                          <Send size={14} /> Xuất bản
                        </button>

                        <button
                          type="button"
                          className="btn delete"
                          onClick={() => onDelete(id)}
                        >
                          <Trash size={14} /> Xóa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredBills.length === 0 && !error && (
          <p className="no-data">Không có hóa đơn nào.</p>
        )}
      </div>
    </div>
  );
}
