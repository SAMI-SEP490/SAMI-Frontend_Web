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

function notifyError(message) {
  alert("❌ " + message);
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
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role);

      if (payload.role === "OWNER") {
        listBuildingsForParking().then(setBuildings);
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
   CONTAINER
   =============================== */
.container {
  max-width: 1200px;
  margin: 40px auto;
  padding: 24px 30px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.container h2 {
  font-size: 26px;
  font-weight: 700;
  color: #1e3a8a;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 10px;
  margin-bottom: 24px;
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
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

/* ===============================
   TABLE
   =============================== */
table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f3f4f6;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  text-align: left;
}

th {
  font-weight: 600;
  color: #374151;
}

tbody tr:hover {
  background: #f9fafb;
}

td button {
  margin-right: 6px;
}

/* ===============================
   STATUS BADGE
   =============================== */
.status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
}

.status.active {
  background: #dcfce7;
  color: #166534;
}

.status.inactive {
  background: #e5e7eb;
  color: #374151;
}

.status.deactivated {
  background: #fee2e2;
  color: #991b1b;
}

/* ===============================
   BUTTONS
   =============================== */
button {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  border: none;
  cursor: pointer;
  background: #e5e7eb;
}

button:hover {
  opacity: 0.9;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.primary {
  background: #3b82f6;
  color: #fff;
}

button.success {
  background: #22c55e;
  color: #fff;
}

button.warning {
  background: #f59e0b;
  color: #fff;
}

button.danger {
  background: #ef4444;
  color: #fff;
}

/* ===============================
   LOADING / EMPTY
   =============================== */
.loading-text,
.no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* ===============================
   MODAL OVERLAY (FIXED)
   =============================== */
.vehicle-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.vehicle-modal {
  position: relative;
  z-index: 10001;

  background: #ffffff;
  width: 360px;
  max-width: 90%;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);

  animation: popup 0.25s ease-out;
}

/* ===============================
   MODAL TITLE
   =============================== */
.vehicle-modal h3 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}
/* ===============================
   MODAL FORM
   =============================== */
.vehicle-modal select {
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 18px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}
/* ===============================
   MODAL ACTIONS
   =============================== */
.vehicle-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
.vehicle-modal-actions button {
  min-width: 90px;
  padding: 8px 14px;
}
.vehicle-modal-actions .btn-cancel {
  background: #e5e7eb;
  color: #374151;
}
.vehicle-modal-actions .btn-confirm {
  background: #3b82f6;
  color: white;
}
.vehicle-modal-actions .btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.vehicle-modal {
  animation: popup 0.25s ease-out;
}
.vehicle-modal-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 12px;
}
@keyframes popup {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
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
            <thead>
              <tr>
                <th>Biển số</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Slot</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.vehicle_id}>
                  <td>
                    <b>{v.registration?.license_plate || "—"}</b>
                  </td>

                  <td>
                    {VEHICLE_TYPE_VN[v.registration?.vehicle_type] || "—"}
                  </td>

                  <td>{STATUS_VN[v.status]}</td>

                  <td>
                    {v.slot?.slot_number || "—"}
                  </td>

                  <td>
                    {v.status === "active" && (
                      <>
                        <button onClick={() => openSlotModal(v, "change")}>
                          🔁 Đổi slot
                        </button>
                        <button onClick={() => handleDeactivate(v)}>
                          ⛔ Ngừng
                        </button>
                      </>
                    )}

                    {(v.status === "inactive" || v.status === "deactivated") && (
                      <button onClick={() => openSlotModal(v, "reactivate")}>
                        ▶️ Kích hoạt
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
