import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { colors } from "../../constants/colors";
import { ROUTES } from "../../constants/routes";
import { getBillById, updateDraftBill } from "../../services/api/bills";
import { http } from "../../services/http";
import { listUsers } from "../../services/api/users";

/* ================== Helper (giữ nguyên như BillDetailPage) ================== */
function parseDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}
function fmtMoney(n) {
  if (n == null) return "";
  return Number(n);
}
function extractRoomId(detail) {
  return (
    detail?.room_id ??
    detail?.roomId ??
    detail?.room?.room_id ??
    detail?.room?.id ??
    null
  );
}
function extractPayerId(detail) {
  return (
    detail?.tenant_user_id ??
    detail?.tenantUserId ??
    detail?.tenant_id ??
    detail?.tenantId ??
    detail?.user_id ??
    detail?.payer_id ??
    null
  );
}
function extractCreatorId(detail) {
  return (
    detail?.created_by_user_id ??
    detail?.created_by ??
    detail?.creator_id ??
    detail?.staff_id ??
    null
  );
}
function extractUserId(u) {
  return u?.id ?? u?.user_id ?? null;
}
function extractUserName(u) {
  return u?.full_name ?? u?.name ?? u?.username ?? u?.email ?? null;
}

/* ================== EDIT PAGE ================== */
export default function EditBillPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [roomLabel, setRoomLabel] = useState("—");
  const [payerName, setPayerName] = useState("—");
  const [creatorName, setCreatorName] = useState("—");

  const [form, setForm] = useState({
    billing_period_start: "",
    billing_period_end: "",
    due_date: "",
    penalty_amount: 0,
    total_amount: 0,
    description: "",
    tenant_user_id: null,
    created_by_user_id: null,
    room_id: null,
  });

  /* ========== LOAD BILL ========== */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const rawId = id ?? location?.state?.billId;
        const numId = Number(rawId);
        if (!Number.isFinite(numId) || numId <= 0) {
          setErr("Invalid Bill ID");
          return;
        }

        const detailFromApi = await getBillById(numId);
        const detail = { ...detailFromApi, ...(location?.state?.bill || {}) };

        if (cancelled) return;

        /* ----- LẤY PHÒNG ----- */
        const roomId = extractRoomId(detail);
        if (roomId) {
          try {
            const res = await http.get(`/room/${roomId}`);
            const rd = res?.data?.data ?? res?.data ?? {};
            const label =
              rd?.room_number ?? rd?.name ?? rd?.number ?? `Phòng ${roomId}`;
            setRoomLabel(label);
          } catch {
            setRoomLabel(`Phòng ${roomId}`);
          }
        }

        /* ----- LẤY USERS 1 LẦN ----- */
        let userMap = new Map();
        try {
          const res = await listUsers();
          const arr = Array.isArray(res) ? res : res?.items ?? [];
          arr.forEach((u) => {
            const uid = extractUserId(u);
            const nm = extractUserName(u);
            if (uid && nm) userMap.set(Number(uid), nm);
          });
        } catch {}

        /* ----- TÊN NGƯỜI THANH TOÁN ----- */
        const payerId = extractPayerId(detail);
        payerId &&
          setPayerName(userMap.get(Number(payerId)) || `User #${payerId}`);

        /* ----- TÊN NGƯỜI TẠO ----- */
        const creatorId = extractCreatorId(detail);
        creatorId &&
          setCreatorName(
            userMap.get(Number(creatorId)) || `User #${creatorId}`
          );

        /* ----- SET FORM ----- */
        setForm({
          billing_period_start: parseDate(detail.billing_period_start),
          billing_period_end: parseDate(detail.billing_period_end),
          due_date: parseDate(detail.due_date),
          penalty_amount: detail.penalty_amount ?? 0,
          total_amount: detail.total_amount ?? 0,
          description: detail.description ?? "",
          tenant_user_id: payerId ?? null,
          created_by_user_id: creatorId ?? null,
          room_id: roomId ?? null,
        });
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, location?.state]);

  /* ========== HANDLE INPUT ========== */
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
    }));
  };

  /* ========== SUBMIT ========== */
  async function onSubmit() {
    try {
      setLoading(true);
      const numId = Number(id);
      await updateDraftBill(numId, form);

      alert("Cập nhật thành công!");
      navigate(ROUTES.bills);
    } catch (e) {
      alert(e?.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Đang tải…</div>;
  if (err)
    return (
      <div style={{ padding: 24 }}>
        <div className="alert alert-danger">{err}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>
    );

  /* ================================================================
     =============== FORM UI GIỐNG HỆT BILL DETAIL ==================
     ================================================================ */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: 24,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div style={cardWrap}>
        <div style={cardHeader}>
          <div style={{ fontWeight: 800 }}>Chỉnh sửa hóa đơn</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-light"
              onClick={() => navigate(ROUTES.bills)}
            >
              Đóng
            </button>
            <button className="btn btn-primary" onClick={onSubmit}>
              Lưu thay đổi
            </button>
          </div>
        </div>

        <div style={cardBody}>
          {/* Row 1 */}
          <div style={row}>
            <div style={cellLeft}>Phòng:</div>
            <div style={cellRight}>{roomLabel}</div>

            <div style={cellLeft}>Người thanh toán:</div>
            <div style={cellRight}>{payerName}</div>
          </div>

          {/* Row 2 */}
          <div style={row}>
            <div style={cellLeft}>Bắt đầu kỳ:</div>
            <input
              type="date"
              name="billing_period_start"
              value={form.billing_period_start}
              onChange={onChange}
              style={inputBox}
            />

            <div style={cellLeft}>Kết thúc kỳ:</div>
            <input
              type="date"
              name="billing_period_end"
              value={form.billing_period_end}
              onChange={onChange}
              style={inputBox}
            />
          </div>

          {/* Row 3 */}
          <div style={row}>
            <div style={cellLeft}>Hạn thanh toán:</div>
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={onChange}
              style={inputBox}
            />
            <div />
            <div />
          </div>

          {/* Row 4 */}
          <div style={row}>
            <div style={cellLeft}>Tiền phạt:</div>
            <input
              type="number"
              name="penalty_amount"
              value={form.penalty_amount}
              onChange={onChange}
              style={inputBox}
            />

            <div style={cellLeft}>Tổng tiền:</div>
            <input
              type="number"
              name="total_amount"
              value={form.total_amount}
              onChange={onChange}
              style={inputBox}
            />
          </div>

          {/* Description */}
          <div>
            <div style={{ color: "#475569", marginBottom: 6 }}>Mô tả</div>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                height: 140,
                resize: "vertical",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================== STYLES COPY Y NGUYÊN ================== */
const cardWrap = {
  width: 860,
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,.08)",
};
const cardHeader = {
  padding: "16px 18px",
  borderBottom: "1px solid #EEF2F7",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const cardBody = { padding: 24, display: "grid", gap: 20 };
const row = {
  display: "grid",
  gridTemplateColumns: "160px 1fr 160px 1fr",
  gap: 10,
  alignItems: "center",
};
const cellLeft = { color: "#475569", textAlign: "right" };
const cellRight = { color: "#0F172A", fontWeight: 700 };
const inputBox = {
  width: "100%",
  borderRadius: 8,
  padding: "8px 10px",
  border: "1px solid #CBD5E1",
  fontWeight: 600,
};
