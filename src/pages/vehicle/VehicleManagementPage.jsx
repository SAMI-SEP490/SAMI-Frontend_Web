import { useEffect, useState } from "react";
import {
  listVehicles,
  deactivateVehicle,
  reactivateVehicle,
  changeVehicleSlot,
} from "../../services/api/vehicle";
import { listAvailableSlotsForVehicle } from "../../services/api/parking-slots";
import { listBuildingsForParking } from "../../services/api/parking-slots";
import { getAccessToken } from "../../services/http";
import { createPortal } from "react-dom";
const VEHICLE_TYPE_VN = {
  two_wheeler: "Xe 2 bánh",
  four_wheeler: "Xe 4 bánh",
};

const STATUS_VN = {
  active: "Đang hoạt động",
  inactive: "Ngừng",
  deactivated: "Đã hủy",
};
function notifySuccess(message) {
  alert("✅ " + message);
}

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalError, setModalError] = useState("");
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  function ModalPortal({ children }) {
    return createPortal(children, document.body);
  }
  async function confirmSlot() {
    if (!selectedSlotId || !selectedVehicle) return;

    setModalError("");

    try {
      if (selectedVehicle.mode === "reactivate") {
        await reactivateVehicle(
          selectedVehicle.vehicle_id,
          Number(selectedSlotId)
        );
        notifySuccess("Kích hoạt xe thành công!");
      }

      if (selectedVehicle.mode === "change") {
        await changeVehicleSlot(
          selectedVehicle.vehicle_id,
          Number(selectedSlotId)
        );
        notifySuccess("Đổi slot xe thành công!");
      }

      setShowSlotModal(false);
      setSelectedVehicle(null);
      await loadVehicles();
    } catch (err) {
      console.log("❌ SLOT ERROR:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra, vui lòng thử lại";

      setModalError(message);
    }
  }
  async function loadVehicles() {
    setLoading(true);
    try {
      const params = {
        type: filterType || undefined,
        status: filterStatus || undefined,
      };

      if (userRole === "OWNER" && filterBuilding) {
        params.building_id = filterBuilding;
      }

      const res = await listVehicles(params);
      console.log("🚘 VEHICLE API RAW:", res);
      // 🔥 res ĐÃ LÀ ARRAY
      setVehicles(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }
  function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN");
}
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role);

      if (payload.role === "OWNER") {
        listBuildingsForParking().then((res) => {
          setBuildings(res || []);

          // ⭐ AUTO SELECT BUILDING ĐẦU TIÊN
          if (res && res.length > 0) {
            setFilterBuilding(res[0].building_id.toString());
          }
        });
      }
    } catch (err) {
      console.error("❌ Invalid token", err);
    }
  }, []);
  useEffect(() => {
    if (userRole) loadVehicles();
  }, [filterType, filterStatus, filterBuilding, userRole]);

  // ===============================
  // OPEN SLOT MODAL
  // ===============================
  async function openSlotModal(vehicle, mode) {
    setSelectedVehicle({ ...vehicle, mode });
    setSelectedSlotId("");
    setShowSlotModal(true);
    console.log('SELECTED VEHICLE:', vehicle);
    const slots = await listAvailableSlotsForVehicle(vehicle.vehicle_id);
    setAvailableSlots(slots);
  }

  // ===============================
  // DEACTIVATE
  // ===============================
  async function handleDeactivate(vehicle) {
    if (!window.confirm("Bạn có chắc muốn ngừng xe này? Slot sẽ được nhả.")) return;
    await deactivateVehicle(vehicle.vehicle_id);
    await loadVehicles();
  }
  const pageStyle = `
/* ===============================
   VARIABLES
   =============================== */
:root {
  --primary: #2563eb;
  --primary-soft: #eff6ff;

  --success: #16a34a;
  --success-soft: #dcfce7;

  --danger: #dc2626;
  --danger-soft: #fee2e2;

  --gray-900: #111827;
  --gray-700: #374151;
  --gray-500: #6b7280;
  --gray-300: #d1d5db;
  --gray-200: #e5e7eb;
  --gray-100: #f3f4f6;

  --radius: 10px;
}

/* ===============================
   CONTAINER
   =============================== */
.container {
  max-width: 1200px;
  margin: 32px auto;
  padding: 24px;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
}

.container h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 20px;
}

/* ===============================
   FILTER BAR
   =============================== */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-bar select {
  flex: 1;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--gray-300);
  font-size: 14px;
  background: #fff;
}

.filter-bar select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

/* ===============================
   TABLE
   =============================== */
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

thead th {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-500);
  background: var(--gray-100);
  height: 48px;
  line-height: 48px;
  padding: 0 14px;
}

thead th:first-child {
  border-top-left-radius: 8px;
}

thead th:last-child {
  border-top-right-radius: 8px;
}

tbody tr {
  height: 56px;
  transition: background 0.15s ease;
}
td {
  height: 56px;
  padding: 0 14px;
  font-size: 14px;
  color: var(--gray-700);
  border-bottom: 1px solid var(--gray-200);
  vertical-align: middle;
}

td b {
  color: var(--gray-900);
}

/* Prevent date wrapping */
td:nth-child(3),
td:nth-child(4),
th:nth-child(3),
th:nth-child(4) {
  white-space: nowrap;
}

/* ===============================
   STATUS BADGE
   =============================== */
.status {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
}

.status.active {
  background: var(--success-soft);
  color: var(--success);
}

.status.inactive {
  background: var(--gray-200);
  color: var(--gray-700);
}

.status.deactivated {
  background: var(--danger-soft);
  color: var(--danger);
}

/* ===============================
   ACTION BUTTONS
   =============================== */
.btn-action {
  min-width: 96px;
  height: 32px;
  font-size: 13px;
  border-radius: 6px;
}
button {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  border: none;
  cursor: pointer;
  background: var(--gray-200);
  color: var(--gray-700);
  transition: all 0.15s ease;
}

button:hover {
  background: var(--gray-300);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.primary {
  background: var(--primary);
  color: #fff;
}

button.primary:hover {
  background: #1d4ed8;
}

button.success {
  background: var(--success);
  color: #fff;
}

button.danger {
  background: var(--danger);
  color: #fff;
}
.action-col {
  white-space: nowrap;
}

.action-col > div {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-col button {
  height: 32px;
  min-width: 88px;
  padding: 0 10px;
}

/* ===============================
   EMPTY / LOADING
   =============================== */
.loading-text,
.no-data {
  text-align: center;
  padding: 48px;
  font-size: 14px;
  color: var(--gray-500);
}

/* ===============================
   MODAL OVERLAY
   =============================== */
.vehicle-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

/* ===============================
   MODAL
   =============================== */
.vehicle-modal {
  background: #fff;
  width: 380px;
  max-width: 92%;
  padding: 22px;
  border-radius: 14px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
  animation: popup 0.2s ease-out;
}

.vehicle-modal h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 14px;
}

.vehicle-modal select {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--gray-300);
  margin-bottom: 16px;
}

.vehicle-modal select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

/* ===============================
   MODAL ACTIONS
   =============================== */
.vehicle-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.vehicle-modal-actions .btn-cancel {
  background: var(--gray-200);
  color: var(--gray-700);
}

.vehicle-modal-actions .btn-confirm {
  background: var(--primary);
  color: #fff;
}

/* ===============================
   MODAL ERROR
   =============================== */
.vehicle-modal-error {
  background: var(--danger-soft);
  color: var(--danger);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 12px;
}
th,
td {
  text-align: left;
}

th:nth-child(2),
td:nth-child(2),
th:nth-child(3),
td:nth-child(3),
th:nth-child(4),
td:nth-child(4),
th:nth-child(5),
td:nth-child(5),
th:nth-child(6),
td:nth-child(6),
th:nth-child(7),
td:nth-child(7) {
  text-align: center;
}
.status {
  min-width: 120px;
  height: 28px;
  line-height: 28px;
  justify-content: center;
}
/* ===============================
   ANIMATION
   =============================== */
@keyframes popup {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
`;

  // ===============================
  // UI
  // ===============================
  return (
    <>
    
      <style>{pageStyle}</style>
      <div className="container">
        <h2>🚘 Quản lý phương tiện</h2>

        {/* FILTER */}
        <div className="filter-bar">
          {userRole === "OWNER" && (
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
            >
              <option value="">Tất cả tòa nhà</option>
              {buildings.map((b) => (
                <option key={b.building_id} value={b.building_id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tất cả loại xe</option>
            <option value="two_wheeler">Xe 2 bánh</option>
            <option value="four_wheeler">Xe 4 bánh</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng</option>
            <option value="deactivated">Đã hủy</option>
          </select>
        </div>

        {/* TABLE */}
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table>
              <colgroup>
    <col style={{ width: "16%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "14%" }} />
    <col style={{ width: "14%" }} />
    <col style={{ width: "16%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "18%" }} />
  </colgroup>
            <thead>
              <tr>
                <th>Biển số</th>
                <th>Loại</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Trạng thái</th>
                <th>Mã chỗ đỗ</th>
                <th className="center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.vehicle_id}>
                  <td><b>{v.registration?.license_plate || "—"}</b></td>

                  <td>{VEHICLE_TYPE_VN[v.registration?.vehicle_type] || "—"}</td>

                  <td>{formatDate(v.registration?.start_date)}</td>

                  <td>{formatDate(v.registration?.end_date)}</td>

                  <td className="center">
                    <span className={`status ${v.status}`}>
                      {STATUS_VN[v.status]}
                    </span>
                  </td>

                  <td>{v.slot?.slot_number || "—"}</td>

                  <td className="center action-col">
                    {v.status === "active" && (
                      <>
                        <button className="btn-action" onClick={() => openSlotModal(v, "change")}> Đổi slot</button>
                        <button className="btn-action danger" onClick={() => handleDeactivate(v)}> Ngừng</button>
                      </>
                    )}

                    {(v.status === "inactive" || v.status === "deactivated") && (
                      <button className="btn-action primary" onClick={() => openSlotModal(v, "reactivate")}>
                         Kích hoạt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>
      {/* SLOT MODAL */}
      {showSlotModal && (
        <ModalPortal>
          <div className="vehicle-modal-overlay">
            <div className="vehicle-modal">
              <h3>
                {selectedVehicle?.mode === "reactivate"
                  ? "Kích hoạt xe & gán slot"
                  : "Đổi slot xe"}
              </h3>
              {modalError && (
                <div className="vehicle-modal-error">
                  ❌ {modalError}
                </div>
              )}
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
              >
                <option value="">-- Chọn slot --</option>
                {availableSlots.map((s) => (
                  <option key={s.slot_id} value={s.slot_id}>
                    {s.slot_number}
                  </option>
                ))}
              </select>
              <div className="vehicle-modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowSlotModal(false)}
                >
                  Hủy
                </button>

                <button
                  className="btn-confirm"
                  disabled={!selectedSlotId}
                  onClick={confirmSlot}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}</>
  );
}
