import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// ✅ tạo bill luôn là nháp
import { createDraftBill, precheckDuplicateBill } from "@/services/api/bills";
import { http, unwrap as un } from "@/services/http";

// ======= Helpers =======
function toISODate(v) {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes("T")) return s.split("T")[0];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
const toNum = (v, d = 0) => {
  if (v === "" || v === null || v === undefined) return d;
  const n = Number(v);
  return Number.isNaN(n) ? d : n;
};

export default function CreateBillPage() {
  const nav = useNavigate();

  // Form state
  const [roomId, setRoomId] = useState("");
  const [tenantUserId, setTenantUserId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [description, setDescription] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("0");
  const [dueDate, setDueDate] = useState("");

  // Data sources
  const [rooms, setRooms] = useState([]);
  const [tenantsInRoom, setTenantsInRoom] = useState([]);

  // UX state
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warn, setWarn] = useState("");

  const totalAmount = useMemo(() => {
    const base = toNum(baseAmount, 0);
    const pen = toNum(penaltyAmount, 0);
    return base + pen;
  }, [baseAmount, penaltyAmount]);

  // ======= Load Rooms =======
  useEffect(() => {
    let cancelled = false;
    async function loadRooms() {
      setLoadingRooms(true);
      setError("");
      try {
        // Try primary route
        let res = await http.get("/room", { validateStatus: () => true });
        if (
          res?.status >= 400 ||
          !Array.isArray(res?.data?.data ?? res?.data)
        ) {
          // Fallback route
          res = await http.get("/room/all", { validateStatus: () => true });
        }
        if (res?.status >= 400)
          throw new Error(
            res?.data?.message || "Không tải được danh sách phòng"
          );
        const data = un(res);
        const items = Array.isArray(data)
          ? data
          : data?.items ?? data?.data ?? [];
        if (!cancelled) setRooms(items);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Không tải được phòng");
      } finally {
        if (!cancelled) setLoadingRooms(false);
      }
    }
    loadRooms();
    return () => {
      cancelled = true;
    };
  }, []);

  // ======= When Room changes -> load tenants in that room =======
  useEffect(() => {
    let cancelled = false;
    async function loadTenants(roomIdVal) {
      setLoadingTenants(true);
      setWarn("");
      setTenantUserId("");
      try {
        if (!roomIdVal) {
          setTenantsInRoom([]);
          return;
        }
        // Prefer GET /room/:id (expects tenants embedded)
        let res = await http.get(`/room/${roomIdVal}`, {
          validateStatus: () => true,
        });
        if (res?.status >= 400)
          throw new Error(
            res?.data?.message || "Không lấy được thông tin phòng"
          );
        const room = un(res);

        let tenants =
          room?.tenants ||
          room?.occupants ||
          room?.currentTenants ||
          room?.room_tenants ||
          [];

        // If backend doesn't embed tenants -> fallback to /tenant/all and filter
        if (!Array.isArray(tenants) || tenants.length === 0) {
          const resTen = await http.get("/tenant/all", {
            validateStatus: () => true,
          });
          if (resTen?.status < 400) {
            const all = un(resTen);
            const arr = Array.isArray(all)
              ? all
              : all?.items ?? all?.data ?? [];
            tenants = arr.filter((t) => {
              const rid = String(
                t?.room_id ??
                  t?.current_room_id ??
                  t?.room?.room_id ??
                  t?.current_room?.room_id ??
                  ""
              );
              return rid && rid === String(roomIdVal);
            });
          }
        }

        // Normalize to {user_id, full_name}
        const normalized = (tenants || [])
          .map((t) => ({
            user_id: t?.user_id ?? t?.id ?? t?.user?.user_id ?? t?.user?.id,
            full_name:
              t?.full_name ??
              t?.name ??
              t?.user?.full_name ??
              t?.user?.name ??
              "(Chưa rõ tên)",
          }))
          .filter((x) => x.user_id);

        if (!cancelled) setTenantsInRoom(normalized);
      } catch (e) {
        if (!cancelled) {
          setTenantsInRoom([]);
          setWarn(e?.message || "Không lấy được người thuê của phòng này");
        }
      } finally {
        if (!cancelled) setLoadingTenants(false);
      }
    }
    loadTenants(roomId);
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // ======= Validation =======
  function validateForm() {
    const errors = [];
    if (!roomId) errors.push("Vui lòng chọn Phòng");
    if (!tenantUserId) errors.push("Vui lòng chọn Người thanh toán");
    if (!periodStart)
      errors.push("Vui lòng nhập Ngày bắt đầu kỳ (billing_period_start)");
    if (!periodEnd)
      errors.push("Vui lòng nhập Ngày tạo kỳ (billing_period_end)");
    if (
      periodStart &&
      periodEnd &&
      toISODate(periodEnd) < toISODate(periodStart)
    ) {
      errors.push("Ngày tạo kỳ phải >= Ngày bắt đầu kỳ");
    }
    if (!dueDate) errors.push("Vui lòng chọn Hạn thanh toán");
    if (dueDate && periodEnd && toISODate(dueDate) < toISODate(periodEnd)) {
      errors.push("Hạn thanh toán phải >= Ngày tạo kỳ");
    }
    const base = toNum(baseAmount, NaN);
    if (Number.isNaN(base) || base < 0)
      errors.push("Tổng tiền tháng không hợp lệ");
    const pen = toNum(penaltyAmount, NaN);
    if (Number.isNaN(pen) || pen < 0) errors.push("Tiền phạt không hợp lệ");
    return errors;
  }

  // ======= Submit (SAVE DRAFT) =======
  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setWarn("");

    const errs = validateForm();
    if (errs.length) {
      setError(errs.join("\n"));
      return;
    }

    try {
      setSubmitting(true);

      // Optional pre-check duplicate
      const ok = await precheckDuplicateBill(roomId, periodStart);
      if (!ok) {
        setSubmitting(false);
        setWarn(
          "Phòng này có thể đã có hoá đơn cho kỳ bắt đầu này. Hãy kiểm tra lại hoặc đổi ngày bắt đầu."
        );
        return;
      }

      const payload = {
        roomId: Number(roomId),
        tenantUserId: Number(tenantUserId),
        billing_period_start: toISODate(periodStart),
        billing_period_end: toISODate(periodEnd),
        description,
        due_date: toISODate(dueDate),
        penalty_amount: toNum(penaltyAmount, 0),
        total_amount: toNum(baseAmount, 0) + toNum(penaltyAmount, 0),

        // ✅ ép draft (kể cả khi BE auto default)
        status: "draft",
      };

      const created = await createDraftBill(payload);
      alert("Lưu hoá đơn nháp thành công.");

      const id =
        created?.bill_id ??
        created?.id ??
        created?.data?.bill_id ??
        created?.data?.id;

      if (id) nav(`/bills/${id}/edit`);
      else nav("/bills");
    } catch (e) {
      setError(e?.message || "Lưu hoá đơn nháp thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  // ======= UI =======
  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">Tạo hoá đơn (Nháp)</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => nav(-1)}>
            Huỷ
          </button>
          <button
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : "Lưu nháp"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger white-space-pre-wrap">
          {String(error)}
        </div>
      )}
      {warn && (
        <div className="alert alert-warning white-space-pre-wrap">
          {String(warn)}
        </div>
      )}

      <form className="row g-3" onSubmit={onSubmit}>
        {/* ROOM */}
        <div className="col-md-4">
          <label className="form-label">
            Phòng <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={loadingRooms}
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map((r) => {
              const id = r?.room_id ?? r?.id;
              const label = r?.room_number ?? r?.name ?? `Phòng #${id}`;
              return (
                <option key={id} value={id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        {/* TENANT */}
        <div className="col-md-4">
          <label className="form-label">
            Người thanh toán <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            value={tenantUserId}
            onChange={(e) => setTenantUserId(e.target.value)}
            disabled={!roomId || loadingTenants || tenantsInRoom.length === 0}
          >
            <option value="">-- Chọn người trong phòng --</option>
            {tenantsInRoom.map((t) => (
              <option key={t.user_id} value={t.user_id}>
                {t.full_name}
              </option>
            ))}
          </select>
          {!loadingTenants && roomId && tenantsInRoom.length === 0 && (
            <div className="form-text text-danger">
              Phòng này chưa có người thuê hợp lệ.
            </div>
          )}
        </div>

        {/* PERIOD DATES */}
        <div className="col-md-2">
          <label className="form-label">
            Bắt đầu kỳ <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className="form-control"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">
            Ngày tạo kỳ <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className="form-control"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>

        {/* DESCRIPTION */}
        <div className="col-12">
          <label className="form-label">Mô tả hoá đơn</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Tiền phòng + Điện + Nước..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* AMOUNTS */}
        <div className="col-md-4">
          <label className="form-label">
            Tổng tiền tháng (không gồm phạt){" "}
            <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            className="form-control"
            placeholder="VD: 3200000"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Tiền phạt (nếu quá hạn)</label>
          <input
            type="number"
            min="0"
            step="1000"
            className="form-control"
            value={penaltyAmount}
            onChange={(e) => setPenaltyAmount(e.target.value)}
          />
          <div className="form-text">
            Có thể để 0 khi tạo, tính sau khi thu tiền/quá hạn.
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label">Tổng phải thu (tự tính)</label>
          <input
            className="form-control"
            value={totalAmount.toLocaleString()}
            readOnly
          />
        </div>

        {/* DUE DATE */}
        <div className="col-md-4">
          <label className="form-label">
            Hạn thanh toán <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className="form-control"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* ACTIONS (mobile fallback) */}
        <div className="col-12 d-flex gap-2 d-md-none">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => nav(-1)}
          >
            Huỷ
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : "Lưu nháp"}
          </button>
        </div>
      </form>
    </div>
  );
}
