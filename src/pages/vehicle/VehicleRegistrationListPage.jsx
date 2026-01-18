import React, { useEffect, useState } from "react";
import {
  listVehicleRegistrations,
  approveVehicleRegistration,
  rejectVehicleRegistration,
  deleteVehicleRegistration
} from "../../services/api/vehicle";
import { listAvailableParkingSlots,
  listBuildingsForParking
 } from "../../services/api/parking-slots";
 import { getAccessToken } from "../../services/http";
import { createPortal } from "react-dom";

export default function VehicleRegistrationListPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
const VEHICLE_TYPE_LABEL = {
  two_wheeler: "Xe 2 bánh",
  four_wheeler: "Xe 4 bánh",
};

const STATUS_LABEL = {
  requested: "Chờ duyệt",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối"
};
const [role, setRole] = useState(null);
const [buildings, setBuildings] = useState([]);
const [selectedBuilding, setSelectedBuilding] = useState("");
  // approve modal
  const [approveTarget, setApproveTarget] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
useEffect(() => {
  const token = getAccessToken();
  if (!token) return;

  const decoded = JSON.parse(atob(token.split(".")[1]));
  setRole(decoded.role?.toUpperCase());
}, []);
useEffect(() => {
  if (role !== "OWNER") return;

  const loadBuildings = async () => {
    const res = await listBuildingsForParking();
    setBuildings(res || []);

    // ⭐ AUTO CHỌN TÒA ĐẦU TIÊN
    if (res?.length) {
      setSelectedBuilding(res[0].building_id.toString());
    }
  };

  loadBuildings();
}, [role]);
  async function fetchData() {
  setLoading(true);

  const filters = {};

  // ✅ OWNER ONLY
  if (role === "OWNER" && selectedBuilding) {
    filters.building_id = selectedBuilding;
  }

  const res = await listVehicleRegistrations(filters);
  setRegistrations(res?.registrations ?? []);
  setLoading(false);
}

useEffect(() => {
  if (!role) return;

  if (role === "OWNER" && !selectedBuilding) return;

  fetchData();
}, [role, selectedBuilding]);
  /* ================= APPROVE ================= */

  const openApprove = (registration) => {
  console.log("CLICK APPROVE", registration.registration_id);
  setApproveTarget(registration);
  setSelectedSlot("");
};
useEffect(() => {
  if (!approveTarget) return;

  const loadSlots = async () => {
    const available = await listAvailableParkingSlots({
      registration_id: approveTarget.registration_id
    });
    setSlots(available || []);
  };

  loadSlots();
}, [approveTarget]);
  const handleApprove = async () => {
    if (!selectedSlot) {
      alert("Vui lòng chọn slot");
      return;
    }

    await approveVehicleRegistration(
      approveTarget.registration_id,
      Number(selectedSlot)
    );

    setApproveTarget(null);
    fetchData();
  };

  /* ================= REJECT ================= */

  const handleReject = async (id) => {
    if (!window.confirm("Từ chối đăng ký này?")) return;

    await rejectVehicleRegistration(id, {
      rejection_reason: "Không đủ điều kiện"
    });

    fetchData();
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa vĩnh viễn đơn đăng ký này?")) return;
    await deleteVehicleRegistration(id);
    fetchData();
  };

  if (loading) return <p className="loading-text">Đang tải...</p>;

  return (
    <>
    
      {/* ===== MAIN TABLE ===== */}
      <div className="container">
        <h2 className="title">Danh sách đăng ký xe</h2>
{role === "OWNER" && (
  <div style={{ marginBottom: 16 }}>
    <select
      value={selectedBuilding}
      onChange={(e) => setSelectedBuilding(e.target.value)}
    >
      <option value="">-- Tất cả tòa nhà --</option>
      {buildings.map((b) => (
        <option key={b.building_id} value={b.building_id}>
          {b.name}
        </option>
      ))}
    </select>
  </div>
)}
        {registrations.length === 0 ? (
          <p className="no-data">Không có dữ liệu</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Người đăng ký</th>
                  <th>Biển số</th>
                  <th>Loại xe</th>
                  <th>Trạng thái</th>
                  <th className="center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr key={r.registration_id}>
                    <td>{i + 1}</td>
                    <td>{r.requester?.user?.full_name}</td>
                    <td>{r.license_plate}</td>
                    <td>{VEHICLE_TYPE_LABEL[r.vehicle_type] || "—"}</td>

                    <td className="center">
                      <span className={`status ${r.status}`}>
                         {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>

                    <td className="center action-col">
                      <div className="action-buttons">
                        {r.status === "requested" && (
                          <>
                            <button
                              className="btn approve"
                              onClick={() => openApprove(r)}
                            >
                              Duyệt
                            </button>

                            <button
                              className="btn reject"
                              onClick={() =>
                                handleReject(r.registration_id)
                              }
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== APPROVE MODAL (OUTSIDE CONTAINER) ===== */}
      {approveTarget &&
  createPortal(
    <div className="modal">
      <div className="modal-content">
        <h3>
          Chọn slot cho xe {approveTarget.license_plate}
        </h3>

        <select
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(e.target.value)}
        >
          <option value="">-- Chọn slot --</option>
          {slots.map((s) => (
            <option key={s.slot_id} value={s.slot_id}>
              {s.slot_number}
            </option>
          ))}
        </select>

        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button className="btn approve" onClick={handleApprove}>
            Xác nhận
          </button>

          <button
            className="btn reject"
            onClick={() => setApproveTarget(null)}
            style={{ marginLeft: 8 }}
          >
            Hủy 
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}
    </>
  );
}

