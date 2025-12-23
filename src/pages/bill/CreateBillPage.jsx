// src/pages/bill/CreateBillPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createDraftBill, precheckDuplicateBill } from "@/services/api/bills";
import { listBuildings, listAssignedBuildings } from "@/services/api/building";
import { getRoomsByBuildingId, listRooms } from "@/services/api/rooms";

// ✅ đổi import sang API lấy TẤT CẢ tenant trong phòng
import { getAllTenantsByRoomId } from "@/services/api/tenants";

import { getAccessToken } from "@/services/http";

// ===== Helpers =====
const toNum = (v, d = 0) => {
  if (v === "" || v === null || v === undefined) return d;
  const n = Number(v);
  return Number.isNaN(n) ? d : n;
};

function toISODate(v) {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes("T")) return s.split("T")[0];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function decodeRoleFromToken() {
  try {
    const token = getAccessToken?.();
    if (!token) return "";
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const r = decoded?.role || decoded?.userRole || "";
    return String(r).toUpperCase();
  } catch {
    return "";
  }
}

// unwrap “đủ kiểu” (res / res.data / res.data.data)
function unwrapAny(x) {
  if (!x) return x;
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.data)) return x.data;
  if (Array.isArray(x?.data?.data)) return x.data.data;
  if (Array.isArray(x?.data?.items)) return x.data.items;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.data?.rooms)) return x.data.rooms;
  if (Array.isArray(x?.rooms)) return x.rooms;
  return x?.data?.data ?? x?.data ?? x;
}

export default function CreateBillPage() {
  const nav = useNavigate();

  // ===== ROLE =====
  const [role, setRole] = useState("");

  // ===== Filter / Select =====
  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState(""); // owner chọn / manager auto
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");

  const [tenantsInRoom, setTenantsInRoom] = useState([]);
  const [tenantUserId, setTenantUserId] = useState("");

  // ===== Bill form =====
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [description, setDescription] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("0");
  const [dueDate, setDueDate] = useState("");

  // ===== UX =====
  const [loadingBuilding, setLoadingBuilding] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [warn, setWarn] = useState("");

  const totalAmount = useMemo(() => {
    const base = toNum(baseAmount, 0);
    const pen = toNum(penaltyAmount, 0);
    return base + pen;
  }, [baseAmount, penaltyAmount]);

  // ===== 1) Role from token =====
  useEffect(() => {
    const r = decodeRoleFromToken();
    setRole(r);
  }, []);

  // ===== 2) Load buildings (GIỐNG CreateContract) =====
  useEffect(() => {
    let cancelled = false;

    async function fetchBuildings() {
      if (!role) return;
      setLoadingBuilding(true);
      setError("");
      setWarn("");

      try {
        if (role === "MANAGER") {
          const res = await listAssignedBuildings();
          const assignedList = unwrapAny(res);

          if (!Array.isArray(assignedList) || assignedList.length === 0) {
            throw new Error("Tài khoản quản lý chưa được gán tòa nhà");
          }

          const b = assignedList[0];
          const bId = b?.building_id;
          if (!bId)
            throw new Error("Không lấy được building_id từ assigned building");

          if (!cancelled) {
            setBuildings([b]);
            setBuildingId(String(bId));
          }
          return;
        }

        if (role === "OWNER") {
          const res = await listBuildings();
          const list = unwrapAny(res);
          if (!cancelled) setBuildings(Array.isArray(list) ? list : []);
          return;
        }

        if (!cancelled) {
          setBuildings([]);
          setBuildingId("");
          setRooms([]);
          setRoomId("");
          setTenantsInRoom([]);
          setTenantUserId("");
          setError("Bạn không có quyền tạo hóa đơn.");
        }
      } catch (e) {
        if (!cancelled)
          setError(e?.message || "Không tải được danh sách tòa nhà");
      } finally {
        if (!cancelled) setLoadingBuilding(false);
      }
    }

    fetchBuildings();
    return () => (cancelled = true);
  }, [role]);

  // ===== 3) Load rooms theo building =====
  useEffect(() => {
    let cancelled = false;

    async function fetchRooms() {
      if (!buildingId) {
        setRooms([]);
        return;
      }

      setLoadingRooms(true);
      setError("");
      setWarn("");

      try {
        const res = await getRoomsByBuildingId(buildingId);
        let list = unwrapAny(res);
        list = Array.isArray(list) ? list : [];

        if (list.length === 0) {
          const all = unwrapAny(await listRooms());
          const arr = Array.isArray(all) ? all : [];
          list = arr.filter(
            (r) => String(r?.building_id) === String(buildingId)
          );
        }

        if (!cancelled) setRooms(list);
      } catch (e) {
        if (!cancelled) {
          setRooms([]);
          setError(e?.message || "Không tải được danh sách phòng");
        }
      } finally {
        if (!cancelled) setLoadingRooms(false);
      }
    }

    fetchRooms();
    return () => (cancelled = true);
  }, [buildingId]);

  // ===== 4) Load tenants theo room (✅ dùng /tenant/moor/:roomId) =====
  useEffect(() => {
    let cancelled = false;

    async function fetchTenants() {
      setTenantUserId("");
      if (!roomId) {
        setTenantsInRoom([]);
        return;
      }

      setLoadingTenants(true);
      setWarn("");

      try {
        // ✅ LẤY TẤT CẢ tenant trong phòng
        const res = await getAllTenantsByRoomId(roomId);
        const list = unwrapAny(res);
        const arr = Array.isArray(list) ? list : [];

        const normalized = arr
          .map((t) => ({
            user_id: t?.user_id ?? t?.users?.user_id ?? t?.id,
            full_name: t?.full_name ?? t?.users?.full_name ?? "(Không tên)",
          }))
          .filter((x) => x.user_id);

        if (!cancelled) setTenantsInRoom(normalized);
      } catch {
        if (!cancelled) setWarn("Không lấy được người thuê của phòng");
      } finally {
        if (!cancelled) setLoadingTenants(false);
      }
    }

    fetchTenants();
    return () => (cancelled = true);
  }, [roomId]);

  // ===== Submit =====
  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setWarn("");

    if (role !== "OWNER" && role !== "MANAGER") {
      setError("Bạn không có quyền tạo hóa đơn.");
      return;
    }

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

      const id =
        created?.bill_id ??
        created?.id ??
        created?.data?.bill_id ??
        created?.data?.id;

      alert("Lưu hóa đơn nháp thành công");
      nav(id ? `/bills/${id}/edit` : "/bills");
    } catch (e) {
      setError(e?.message || "Tạo hóa đơn thất bại");
    } finally {
      setSubmitting(false);
    }
  }

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
              disabled={loadingBuilding}
              onChange={(e) => {
                setBuildingId(e.target.value);
                setRoomId("");
              }}
            >
              <option value="">-- Chọn tòa nhà --</option>
              {buildings.map((b) => (
                <option
                  key={b?.building_id ?? b?.id}
                  value={b?.building_id ?? b?.id}
                >
                  {b?.name}
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
            disabled={
              !buildingId ||
              loadingRooms ||
              (role !== "OWNER" && role !== "MANAGER")
            }
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map((r) => (
              <option key={r?.room_id ?? r?.id} value={r?.room_id ?? r?.id}>
                {r?.room_number ??
                  r?.name ??
                  r?.number ??
                  `Phòng ${r?.room_id ?? r?.id}`}
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
            placeholder="VD: 3200000"
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
          <input className="form-control" readOnly value={totalAmount} />
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
