import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDraftBill, precheckDuplicateBill } from "@/services/api/bills";
import { listAssignedBuildings, listBuildings } from "@/services/api/building";
import { listRoomsByBuilding } from "@/services/api/rooms";
import { http, unwrap as un } from "@/services/http";

// ===== Helpers =====
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
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role;

  // ===== Form state =====
  const [buildingId, setBuildingId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [tenantUserId, setTenantUserId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [description, setDescription] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("0");
  const [dueDate, setDueDate] = useState("");

  // ===== Data =====
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenantsInRoom, setTenantsInRoom] = useState([]);

  // ===== UX =====
  const [loadingBuilding, setLoadingBuilding] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warn, setWarn] = useState("");

  const totalAmount = useMemo(
    () => toNum(baseAmount, 0) + toNum(penaltyAmount, 0),
    [baseAmount, penaltyAmount]
  );

  // ===== LOAD BUILDING (Y HỆT CREATE CONTRACT) =====
  useEffect(() => {
    let cancelled = false;

    async function loadBuildings() {
      setLoadingBuilding(true);
      try {
        if (role === "MANAGER") {
          const res = await listAssignedBuildings();
          const list = Array.isArray(res) ? res : res?.data;
          if (!list || list.length === 0)
            throw new Error("Tài khoản quản lý chưa được gán tòa nhà");

          const b = list[0];
          const buildingIdValue = b.building_id || b.id;

          if (!cancelled) {
            setBuildings([b]);
            setBuildingId(buildingIdValue);
          }
        }

        if (role === "OWNER") {
          const res = await listBuildings();
          const list = Array.isArray(res) ? res : res?.data;
          if (!cancelled) setBuildings(list || []);
        }
      } catch (e) {
        if (!cancelled)
          setError(e?.message || "Không tải được danh sách tòa nhà");
      } finally {
        if (!cancelled) setLoadingBuilding(false);
      }
    }

    loadBuildings();
    return () => (cancelled = true);
  }, [role]);

  // ===== LOAD ROOMS THEO BUILDING (KHÔNG FILTER CHAY) =====
  useEffect(() => {
    let cancelled = false;

    async function loadRooms() {
      if (!buildingId) {
        setRooms([]);
        return;
      }
      setLoadingRooms(true);
      try {
        // ✅ FIX: truyền đúng params
        const res = await listRoomsByBuilding({ building_id: buildingId });
        const list = Array.isArray(res) ? res : res?.data;
        if (!cancelled) setRooms(list || []);
      } catch (e) {
        if (!cancelled)
          setError(e?.message || "Không tải được danh sách phòng");
      } finally {
        if (!cancelled) setLoadingRooms(false);
      }
    }

    loadRooms();
    return () => (cancelled = true);
  }, [buildingId]);

  // ===== LOAD TENANT TRONG PHÒNG (GIỮ NGUYÊN LOGIC CŨ) =====
  useEffect(() => {
    let cancelled = false;

    async function loadTenants() {
      setLoadingTenants(true);
      setTenantUserId("");
      try {
        if (!roomId) {
          setTenantsInRoom([]);
          return;
        }
        const res = await http.get(`/room/${roomId}`);
        const room = un(res);
        const tenants =
          room?.tenants ||
          room?.occupants ||
          room?.currentTenants ||
          room?.room_tenants ||
          [];

        const normalized = tenants
          .map((t) => ({
            user_id: t?.user_id ?? t?.id ?? t?.user?.user_id,
            full_name: t?.full_name ?? t?.user?.full_name ?? "(Không tên)",
          }))
          .filter((x) => x.user_id);

        if (!cancelled) setTenantsInRoom(normalized);
      } catch {
        if (!cancelled) setWarn("Không lấy được người thuê của phòng");
      } finally {
        if (!cancelled) setLoadingTenants(false);
      }
    }

    loadTenants();
    return () => (cancelled = true);
  }, [roomId]);

  // ===== SUBMIT =====
  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setWarn("");

    if (!roomId || !tenantUserId || !periodStart || !periodEnd || !dueDate) {
      setError("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setSubmitting(true);
      const ok = await precheckDuplicateBill(roomId, periodStart);
      if (!ok) {
        setWarn("Phòng này đã có hóa đơn cho kỳ này");
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
        total_amount: totalAmount,
        status: "draft",
      };

      const created = await createDraftBill(payload);
      alert("Lưu hóa đơn nháp thành công");

      const id =
        created?.bill_id ??
        created?.id ??
        created?.data?.bill_id ??
        created?.data?.id;

      nav(id ? `/bills/${id}/edit` : "/bills");
    } catch (e) {
      setError(e?.message || "Tạo hóa đơn thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  // ===== UI =====
  return (
    <div className="container py-3">
      <h3>Tạo hóa đơn (Nháp)</h3>

      {error && <div className="alert alert-danger">{error}</div>}
      {warn && <div className="alert alert-warning">{warn}</div>}

      <form className="row g-3" onSubmit={onSubmit}>
        {role === "OWNER" && (
          <div className="col-md-4">
            <label className="form-label">Tòa nhà *</label>
            <select
              className="form-select"
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value);
                setRoomId("");
              }}
            >
              <option value="">-- Chọn tòa nhà --</option>
              {buildings.map((b) => (
                <option key={b.building_id} value={b.building_id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="col-md-4">
          <label className="form-label">Phòng *</label>
          <select
            className="form-select"
            value={roomId}
            disabled={!buildingId || loadingRooms}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map((r) => (
              <option key={r.room_id} value={r.room_id}>
                {r.room_number}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Người thanh toán *</label>
          <select
            className="form-select"
            value={tenantUserId}
            disabled={!roomId || loadingTenants}
            onChange={(e) => setTenantUserId(e.target.value)}
          >
            <option value="">-- Chọn người thuê --</option>
            {tenantsInRoom.map((t) => (
              <option key={t.user_id} value={t.user_id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">Ngày bắt đầu kỳ *</label>
          <input
            type="date"
            className="form-control"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Ngày kết thúc kỳ *</label>
          <input
            type="date"
            className="form-control"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Mô tả hóa đơn</label>
          <textarea
            className="form-control"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Tổng tiền tháng *</label>
          <input
            type="number"
            className="form-control"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Tiền phạt</label>
          <input
            type="number"
            className="form-control"
            value={penaltyAmount}
            onChange={(e) => setPenaltyAmount(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Tổng phải thu</label>
          <input
            className="form-control"
            readOnly
            value={totalAmount.toLocaleString()}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Hạn thanh toán *</label>
          <input
            type="date"
            className="form-control"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="col-12 d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => nav(-1)}
          >
            Hủy
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
