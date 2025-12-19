import React, { useEffect, useState } from "react";
import {
  listVehicleRegistrations,
  approveVehicleRegistration,
  rejectVehicleRegistration,
} from "../../services/api/vehicle";
import { getUserById } from "../../services/api/users";
import "./VehicleRegistrationList.css";

const VEHICLE_TYPE_VN = {
  car: "Ô tô",
  motorcycle: "Xe máy",
  truck: "Xe tải",
  van: "Xe van",
  other: "Khác",
};

const STATUS_VN = {
  requested: "Đã yêu cầu",
  pending: "Đang chờ",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

export default function VehicleRegistrationListPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await listVehicleRegistrations();
      const arr = Array.isArray(res?.registrations) ? res.registrations : [];

      const parsed = await Promise.all(
        arr.map(async (r) => {
          let reason = {};
          try {
            reason = r.reason ? JSON.parse(r.reason) : {};
          } catch {}

          let requestedBy = "—";
          if (r.requested_by) {
            try {
              const u = await getUserById(r.requested_by);
              requestedBy = u?.full_name || r.requested_by;
            } catch {
              requestedBy = r.requested_by;
            }
          }

          return {
            id: r.assignment_id,
            requestedBy,
            plate: reason.license_plate || "—",
            type: reason.type || "other",
            brand: reason.brand || "—",
            color: reason.color || "—",
            status: r.status,
            start: r.start_date,
            end: r.end_date,
            note: r.note || "",
          };
        })
      );

      setRegistrations(parsed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading((p) => ({ ...p, [id]: true }));
    await approveVehicleRegistration(id);
    await fetchRegistrations();
    setActionLoading((p) => ({ ...p, [id]: false }));
  };

  const handleReject = async (id) => {
    setActionLoading((p) => ({ ...p, [id]: true }));
    await rejectVehicleRegistration(id);
    await fetchRegistrations();
    setActionLoading((p) => ({ ...p, [id]: false }));
  };

  const filtered = registrations.filter((r) => {
    if (["canceled", "cancelled"].includes(r.status?.toLowerCase()))
      return false;

    const s = search.toLowerCase();
    const matchSearch =
      r.requestedBy.toLowerCase().includes(s) ||
      r.plate.toLowerCase().includes(s);

    const matchStatus = !statusFilter || r.status === statusFilter;

    return matchSearch && matchStatus;
  });

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Danh sách đăng ký xe</h2>

      {/* FILTER */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔎 Tìm theo tên hoặc biển số..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="status-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="requested">Đã yêu cầu</option>
          <option value="pending">Đang chờ</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Bị từ chối</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="center">#</th>
              <th>Người đăng ký</th>
              <th>Biển số</th>
              <th>Loại xe</th>
              <th>Hãng</th>
              <th>Màu</th>
              <th className="center">Bắt đầu</th>
              <th className="center">Kết thúc</th>
              <th className="center">Trạng thái</th>
              <th>Ghi chú</th>
              <th className="center action-col">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id}>
                <td className="center">{i + 1}</td>
                <td>{r.requestedBy}</td>
                <td>{r.plate}</td>
                <td>{VEHICLE_TYPE_VN[r.type]}</td>
                <td>{r.brand}</td>
                <td>{r.color}</td>
                <td className="center">{formatDate(r.start)}</td>
                <td className="center">{formatDate(r.end)}</td>
                <td className="center">
                  <span className={`status ${r.status}`}>
                    {STATUS_VN[r.status]}
                  </span>
                </td>
                <td>{r.note}</td>
                <td className="action-buttons">
                  {r.status === "requested" && (
                    <>
                      <button
                        className="btn publish"
                        disabled={actionLoading[r.id]}
                        onClick={() => handleApprove(r.id)}
                      >
                        Chấp nhận
                      </button>
                      <button
                        className="btn delete"
                        disabled={actionLoading[r.id]}
                        onClick={() => handleReject(r.id)}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && <p className="no-data">Không có dữ liệu</p>}
      </div>
    </div>
  );
}
