import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { colors } from "../../constants/colors";
import { ROUTES } from "../../constants/routes";
import { getBillById } from "../../services/api/bills";
import { http } from "../../services/http";

/* =============== Helpers =============== */
function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function fmtDateVN(d) {
  const dt = parseDate(d);
  if (!dt) return "—";
  return (
    dt.toLocaleDateString("vi-VN") +
    " " +
    dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}
function fmtDateOnly(d) {
  const dt = parseDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("vi-VN");
}
function fmtMoney(n) {
  if (n == null) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n);
  return v.toLocaleString("vi-VN");
}
function monthLabelFromPeriod(startISO, endISO) {
  const s = parseDate(startISO);
  const e = parseDate(endISO);
  if (!s || !e || s >= e) {
    const m = (s || e || new Date()).getMonth() + 1;
    return `Hóa đơn tháng ${m}`;
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
/** Suy ra trạng thái thanh toán */
function getPaidInfo(b) {
  const status = String(
    b?.status || b?.bill_status || b?.payment_status || ""
  ).toLowerCase();
  const flag =
    Boolean(b?.is_paid ?? b?.paid ?? b?.isPaid) ||
    ["paid", "completed", "settled"].includes(status);

  const totalPaid = Number(
    b?.total_paid ?? b?.amount_paid ?? b?.paid_amount ?? 0
  );
  const totalAmt = Number(b?.total_amount ?? b?.amount ?? 0);
  const calcPaid =
    Number.isFinite(totalPaid) &&
    Number.isFinite(totalAmt) &&
    totalAmt > 0 &&
    totalPaid >= totalAmt;

  const isPaid = flag || calcPaid;
  return {
    isPaid,
    label: isPaid ? "Đã thanh toán" : "Chưa thanh toán",
    totalPaid: Number.isFinite(totalPaid) ? totalPaid : null,
  };
}

/* =============== Page =============== */
export default function BillDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [bill, setBill] = useState(null);

  const [roomLabel, setRoomLabel] = useState("—");
  const [payerName, setPayerName] = useState("—");
  const [creatorName, setCreatorName] = useState("—");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        // id an toàn: params -> state
        const raw = id ?? location?.state?.billId ?? location?.state?.id;
        const numId = Number(raw);
        if (!Number.isFinite(numId) || numId <= 0) {
          setErr("Invalid Bill ID");
          setLoading(false);
          return;
        }

        const detail = await getBillById(numId);
        if (cancelled) return;
        setBill(detail);

        // room label
        const rid = detail?.room_id ?? detail?.roomId;
        if (rid) {
          const r = await http.get(`/room/${rid}`, {
            validateStatus: () => true,
          });
          const rd = r?.data?.data ?? r?.data ?? {};
          const label = rd?.room_number ?? rd?.name ?? `Phòng ${rid}`;
          if (!cancelled) setRoomLabel(String(label));
        }

        // payer
        const uid = detail?.tenant_user_id ?? detail?.tenantUserId;
        if (uid) {
          let ures = await http.get(`/user/detail/${uid}`, {
            validateStatus: () => true,
          });
          if (ures?.status >= 400) {
            ures = await http.get(`/user/${uid}`, {
              validateStatus: () => true,
            });
          }
          const ud = ures?.data?.data ?? ures?.data ?? {};
          const name =
            ud?.full_name ??
            ud?.name ??
            ud?.username ??
            ud?.email ??
            `User #${uid}`;
          if (!cancelled) setPayerName(String(name));
        }

        // creator
        const cid =
          detail?.created_by_user_id ??
          detail?.created_by ??
          detail?.creator_id ??
          detail?.createdByUserId ??
          null;
        if (cid) {
          let cres = await http.get(`/user/detail/${cid}`, {
            validateStatus: () => true,
          });
          if (cres?.status >= 400) {
            cres = await http.get(`/user/${cid}`, {
              validateStatus: () => true,
            });
          }
          const cd = cres?.data?.data ?? cres?.data ?? {};
          const cname =
            cd?.full_name ??
            cd?.name ??
            cd?.username ??
            cd?.email ??
            `User #${cid}`;
          if (!cancelled) setCreatorName(String(cname));
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Không tải được chi tiết hóa đơn");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, location?.state]);

  const billName = useMemo(() => {
    if (!bill) return "—";
    return monthLabelFromPeriod(
      bill?.billing_period_start,
      bill?.billing_period_end
    );
  }, [bill]);

  const createdAt = bill?.created_at ?? bill?.createdAt ?? null;
  const penalty = Number(bill?.penalty_amount ?? 0);
  const total = Number(bill?.total_amount ?? 0);
  const baseMonth = Number.isFinite(total - penalty) ? total - penalty : null;
  const paid = getPaidInfo(bill);

  if (loading) {
    return <div style={{ padding: 24 }}>Đang tải…</div>;
  }
  if (err) {
    return (
      <div style={{ padding: 24 }}>
        <div
          className="alert alert-danger"
          role="alert"
          style={{ borderRadius: 10 }}
        >
          {err}
        </div>
        <button
          onClick={() => navigate(ROUTES.bills)}
          className="btn btn-secondary"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }
  if (!bill) {
    return (
      <div style={{ padding: 24 }}>
        Không tìm thấy hóa đơn (ID: {id}) —{" "}
        <button onClick={() => navigate(ROUTES.bills)} style={linkBtn}>
          quay lại danh sách
        </button>
      </div>
    );
  }

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
          <div style={{ fontWeight: 800, color: "#0F172A" }}>
            Chi tiết hoá đơn
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-light"
              onClick={() => navigate(ROUTES.bills)}
              style={{ borderRadius: 10 }}
            >
              Đóng
            </button>
          </div>
        </div>

        <div style={cardBody}>
          {/* Dòng 1: Tên hoá đơn + Phòng */}
          <div style={row}>
            <div style={cellLeft}>Tên hoá đơn:</div>
            <div style={cellRight}>{billName}</div>

            <div style={cellLeft}>Phòng:</div>
            <div style={cellRight}>{roomLabel}</div>
          </div>

          {/* Dòng 2: Người thanh toán + Người tạo */}
          <div style={row}>
            <div style={cellLeft}>Người thanh toán:</div>
            <div style={cellRight}>{payerName}</div>

            <div style={cellLeft}>Người tạo:</div>
            <div style={cellRight}>{creatorName}</div>
          </div>

          {/* Dòng 3: Kỳ tính */}
          <div style={row}>
            <div style={cellLeft}>Bắt đầu kỳ:</div>
            <div style={cellRight}>
              {fmtDateOnly(bill?.billing_period_start)}
            </div>

            <div style={cellLeft}>Ngày tạo kỳ:</div>
            <div style={cellRight}>{fmtDateOnly(bill?.billing_period_end)}</div>
          </div>

          {/* Dòng 4: Hạn thanh toán + Ngày tạo bill */}
          <div style={row}>
            <div style={cellLeft}>Hạn thanh toán:</div>
            <div style={cellRight}>{fmtDateOnly(bill?.due_date)}</div>

            <div style={cellLeft}>Thời gian tạo:</div>
            <div style={cellRight}>{fmtDateVN(createdAt)}</div>
          </div>

          {/* Dòng 5: Tiền + Trạng thái */}
          <div style={row}>
            <div style={cellLeft}>Tổng tiền tháng:</div>
            <div style={cellRight}>{fmtMoney(baseMonth)}</div>

            <div style={cellLeft}>Tiền phạt:</div>
            <div style={cellRight}>{fmtMoney(penalty)}</div>
          </div>

          <div style={row}>
            <div style={cellLeft}>Tổng phải thu:</div>
            <div style={{ ...cellRight, fontSize: 18 }}>{fmtMoney(total)}</div>

            <div style={cellLeft}>Trạng thái:</div>
            <div style={cellRight}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 40,
                  fontWeight: 800,
                  color: paid.isPaid ? "#065F46" : "#7C2D12",
                  background: paid.isPaid ? "#D1FAE5" : "#FEE2E2",
                }}
              >
                {paid.label}
              </span>
              {Number.isFinite(paid.totalPaid) && (
                <span style={{ marginLeft: 8, color: "#475569" }}>
                  (Đã thu: {fmtMoney(paid.totalPaid)})
                </span>
              )}
            </div>
          </div>

          {/* Mã + Mô tả */}
          <div style={row}>
            <div style={cellLeft}>Mã hoá đơn:</div>
            <div style={cellRight}>{bill?.id ?? bill?.bill_id ?? "—"}</div>
            <div />
            <div />
          </div>

          <div style={{ marginTop: 4 }}>
            <div style={{ color: "#475569", marginBottom: 6 }}>
              Mô tả hoá đơn
            </div>
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: 12,
                whiteSpace: "pre-wrap",
                color: "#0F172A",
                fontWeight: 600,
              }}
            >
              {bill?.description || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------- styles ------- */
const cardWrap = {
  width: 860,
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,.08)",
  overflow: "hidden",
};
const cardHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 18px",
  borderBottom: "1px solid #EEF2F7",
};
const cardBody = { padding: 24, display: "grid", gap: 18 };
const row = {
  display: "grid",
  gridTemplateColumns: "160px 1fr 160px 1fr",
  alignItems: "center",
  gap: 10,
};
const cellLeft = { color: "#475569", textAlign: "right" };
const cellRight = { color: "#0F172A", fontWeight: 700 };
const linkBtn = {
  color: "#0F3D8A",
  background: "none",
  border: "none",
  textDecoration: "underline",
  cursor: "pointer",
  fontWeight: 700,
};
