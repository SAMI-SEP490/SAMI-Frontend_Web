import { useEffect, useState } from "react";
import {
  listVehicles,
  deactivateVehicle,
  reactivateVehicle,
  changeVehicleSlot,
} from "../../services/api/vehicle";
import { listAvailableSlotsForVehicle } from "../../services/api/parking-slots";
import "./VehicleManagementPage.css";

const VEHICLE_TYPE_VN = {
  two_wheeler: "Xe máy",
  four_wheeler: "Ô tô",
};

const STATUS_VN = {
  active: "Đang hoạt động",
  inactive: "Ngừng",
  deactivated: "Đã hủy",
};

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  // ===============================
  // LOAD VEHICLES (FIX pagination)
  // ===============================
  async function loadVehicles() {
    setLoading(true);
    try {
      const res = await listVehicles({
        type: filterType || undefined,
        status: filterStatus || undefined,
      });

      // API returns { items, page, total, limit }
      const list = Array.isArray(res) ? res : res.items;
setVehicles(list || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, [filterType, filterStatus]);

  // ===============================
  // OPEN SLOT MODAL
  // ===============================
  async function openSlotModal(vehicle, mode) {
  setSelectedVehicle({ ...vehicle, mode });
  setSelectedSlotId("");
  setShowSlotModal(true);

  const slots = await listAvailableSlotsForVehicle(vehicle.vehicle_id);
  setAvailableSlots(slots);
}

  // ===============================
  // CONFIRM SLOT
  // ===============================
  async function confirmSlot() {
    if (!selectedSlotId || !selectedVehicle) return;

    if (selectedVehicle.mode === "reactivate") {
      await reactivateVehicle(
        selectedVehicle.vehicle_id,
        Number(selectedSlotId)
      );
    }

    if (selectedVehicle.mode === "change") {
      await changeVehicleSlot(
        selectedVehicle.vehicle_id,
        Number(selectedSlotId)
      );
    }

    setShowSlotModal(false);
    setSelectedVehicle(null);
    await loadVehicles();
  }

  // ===============================
  // DEACTIVATE
  // ===============================
  async function handleDeactivate(vehicle) {
    if (!window.confirm("Bạn có chắc muốn ngừng xe này? Slot sẽ được nhả.")) return;
    await deactivateVehicle(vehicle.vehicle_id);
    await loadVehicles();
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className="container">
      <h2>🚘 Quản lý phương tiện</h2>

      {/* FILTER */}
      <div className="filter-bar">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tất cả loại xe</option>
          <option value="two_wheeler">Xe máy</option>
          <option value="four_wheeler">Ô tô</option>
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

      {/* SLOT MODAL */}
      {showSlotModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {selectedVehicle?.mode === "reactivate"
                ? "Kích hoạt xe & gán slot"
                : "Đổi slot xe"}
            </h3>

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

            <div className="modal-actions">
              <button onClick={() => setShowSlotModal(false)}>Hủy</button>
              <button disabled={!selectedSlotId} onClick={confirmSlot}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
