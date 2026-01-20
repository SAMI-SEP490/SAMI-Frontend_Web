import React, { useEffect, useState } from "react";
import {
  listVehicleRegistrations,
  approveVehicleRegistration,
  rejectVehicleRegistration,
  deleteVehicleRegistration
} from "../../services/api/vehicle";
import "../../pages/vehicle/VehicleRegistrationListPage.css";
import {
  listAvailableParkingSlots,
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
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("vi-VN");
  };
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

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }

    await rejectVehicleRegistration(rejectTarget.registration_id, {
      rejection_reason: rejectionReason.trim()
    });

    setRejectTarget(null);
    setRejectionReason("");
    fetchData();
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa vĩnh viễn đơn đăng ký này?")) return;
    await deleteVehicleRegistration(id);
    fetchData();
  };

  if (loading) return <p className="loading-text">Đang tải...</p>;
  const pageStyle = `
#root {
  isolation: isolate;
  background: #f3f4f6;
}

/* ===============================
   CONTAINER
================================ */
.container {
  max-width: 1200px;
  margin: 32px auto;
  padding: 20px 28px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: #1e3a8a;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 8px;
  margin-bottom: 20px;
}

/* ===============================
   FILTER BAR
================================ */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-label {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
}

.filter-select {
  min-width: 220px;
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-select:hover {
  border-color: #2563eb;
}

.filter-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.search-input,
.status-select {
  flex: 1;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  outline: none;
  background: #f9fafb;
}

.search-input:focus,
.status-select:focus {
  border-color: #3b82f6;
  background: #ffffff;
}

/* ===============================
   TABLE
================================ */
.table-wrapper {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  background: #f8fafc;
  font-weight: 700;
}

th {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #374151;
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

td {
  padding: 12px 10px;
  font-size: 14px;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
  vertical-align: middle;
}
th:nth-child(2),
td:nth-child(2) {
text-align: center;
}
td:nth-child(5),
td:nth-child(6),
th:nth-child(5),
th:nth-child(6),
td:nth-child(7),
th:nth-child(7),{
  white-space: nowrap;
}
.center {
  text-align: center;
  vertical-align: middle;
}

tr:hover {
  background: #f9fafb;
}

/* ===============================
   STATUS BADGES
================================ */
.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 90px;
}
/* Requested = waiting for approve */
.status.requested,
.status.pending {
  background: #fef3c7;
  color: #92400e;
}

/* Approved */
.status.approved {
  background: #d1fae5;
  color: #065f46;
}

/* Rejected */
.status.rejected {
  background: #fee2e2;
  color: #b91c1c;
}

/* ===============================
   ACTION COLUMN
================================ */
.action-col {
  width: 100px;
  text-align: center;
  white-space: nowrap;
}

.action-buttons {
   display: flex;
  justify-content: center;
  align-items: center; 
  gap: 8px;
}

/* ===============================
   BUTTONS
================================ */
.btn {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

/* Approve */
.btn.approve {
  background: #d1fae5;
  color: #065f46;
}

.btn.approve:hover {
  background: #a7f3d0;
}

/* Reject */
.btn.reject {
  background: #fee2e2;
  color: #b91c1c;
}

.btn.reject:hover {
  background: #fecaca;
}

/* Delete */
.btn.delete {
  background: #ef4444;
  color: white;
}

.btn.delete:hover {
  background: #dc2626;
}

/* ===============================
   EMPTY & LOADING
================================ */
.loading-text,
.no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 15px;
}

/* ===============================
   APPROVE MODAL
================================ */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: #ffffff;
  padding: 22px 26px;
  border-radius: 14px;
  min-width: 340px;
  max-width: 90vw;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.25);
  animation: pop 0.18s ease-out;
}

@keyframes pop {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-content h3 {
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.modal select {
  width: 100%;
  padding: 9px 10px;
  margin-top: 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
  
  td,
th {
  vertical-align: middle;
  line-height: 1.4;
}

tbody tr {
  height: 56px;
}
  table * {
  box-sizing: border-box;
}
`;
  return (
    <>
      <style>{pageStyle}</style>
      {/* ===== MAIN TABLE ===== */}
      <div className="container">
        <h2 className="title">Danh sách đăng ký xe</h2>
        {role === "OWNER" && (
          <div className="filter-bar">
            <label className="filter-label">Tòa nhà</label>
            <select
              className="filter-select"
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
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
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th >Ghi chú</th>
                  <th className="center">Trạng thái</th>
                  <th className="center action-col">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr key={r.registration_id}>
                    <td>{i + 1}</td>
                    <td>{r.requester?.user?.full_name}</td>
                    <td>{r.license_plate}</td>
                    <td>{VEHICLE_TYPE_LABEL[r.vehicle_type] || "—"}</td>

                    <td>{formatDate(r.start_date)}</td>
                    <td>{formatDate(r.end_date)}</td>
                    <td>{r.note}</td>
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
                              onClick={() => {
                                setRejectTarget(r);
                                setRejectionReason("");
                              }}
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
      {rejectTarget &&
        createPortal(
          <div className="modal">
            <div className="modal-content">
              <h3>
                Từ chối đăng ký xe {rejectTarget.license_plate}
              </h3>

              <textarea
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  marginTop: 8,
                  resize: "none"
                }}
              />

              <div style={{ marginTop: 12, textAlign: "right" }}>
                <button
                  className="btn reject"
                  onClick={handleReject}
                >
                  Xác nhận từ chối
                </button>

                <button
                  className="btn"
                  onClick={() => setRejectTarget(null)}
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

