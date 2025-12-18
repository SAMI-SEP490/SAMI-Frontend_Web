import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Form, Row, Col } from "react-bootstrap";
import {
  listVehicleRegistrations,
  approveVehicleRegistration,
  rejectVehicleRegistration,
} from "../../services/api/vehicle";
import { getUserById } from "../../services/api/users";
import "./VehicleRegistrationList.css"; // 🔹 CSS mới

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
  PENDING: "Đang chờ",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
};

// 🔹 Hàm format ngày
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "N/A";
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

function VehicleRegistrationListPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch danh sách
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await listVehicleRegistrations();
      const arr = Array.isArray(data?.registrations) ? data.registrations : [];

      const parsed = await Promise.all(
        arr.map(async (r) => {
          let reason = {};
          try {
            reason = r.reason ? JSON.parse(r.reason) : {};
          } catch (e) {}

          // Lấy full_name
          let requestedBy = "N/A";
          if (r.requested_by) {
            try {
              const user = await getUserById(r.requested_by);
              requestedBy = user?.full_name || r.requested_by;
            } catch (e) {
              requestedBy = r.requested_by;
            }
          }

          return {
            id: r.assignment_id,
            requestedBy,
            plateNumber: reason.license_plate || "N/A",
            vehicleType: reason.type || "other",
            brand: reason.brand || "N/A",
            color: reason.color || "N/A",
            status: r.status,
            startDate: r.start_date,
            endDate: r.end_date,
            note: r.note || "",
          };
        })
      );

      setRegistrations(parsed);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đăng ký xe:", error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await approveVehicleRegistration(id);
      fetchRegistrations();
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await rejectVehicleRegistration(id);
      fetchRegistrations();
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // --------------------------------
  // 🔎 Search + Filter (LOẠI canceled)
  // --------------------------------
  const filtered = registrations.filter((r) => {
    // ❗ CHỈ HIỂN THỊ status KHÁC canceled
    if (
      r.status?.toLowerCase() === "canceled" ||
      r.status?.toLowerCase() === "cancelled"
    )
      return false;

    const s = search.toLowerCase();
    const matchSearch =
      r.requestedBy.toLowerCase().includes(s) ||
      r.plateNumber.toLowerCase().includes(s);

    const matchStatus =
      statusFilter === "all" ||
      r.status.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="vehicle-page">
      <h3 className="page-title">Danh sách đăng ký xe</h3>

      {/* 🔹 Search + Filter */}
      <Row className="filter-row">
        <Col md={5}>
          <Form.Control
            placeholder="Tìm theo tên hoặc biển số..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </Col>

        <Col md={3}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="requested">Đã yêu cầu</option>
            <option value="pending">Đang chờ</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Bị từ chối</option>
          </Form.Select>
        </Col>
      </Row>

      {/* TABLE */}
      <Table striped bordered hover responsive className="vehicle-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên người đăng ký</th>
            <th>Biển số xe</th>
            <th>Loại xe</th>
            <th>Thương hiệu</th>
            <th>Màu</th>
            <th>Ngày bắt đầu</th>
            <th>Ngày kết thúc</th>
            <th>Trạng thái</th>
            <th>Ghi chú</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, index) => (
            <tr key={r.id}>
              <td>{index + 1}</td>
              <td>{r.requestedBy}</td>
              <td>{r.plateNumber}</td>
              <td>{VEHICLE_TYPE_VN[r.vehicleType]}</td>
              <td>{r.brand}</td>
              <td>{r.color}</td>
              <td>{formatDate(r.startDate)}</td>
              <td>{formatDate(r.endDate)}</td>
              <td className={`status status-${r.status.toLowerCase()}`}>
                {STATUS_VN[r.status] || r.status}
              </td>
              <td>{r.note}</td>
              <td>
                {r.status.toLowerCase() === "requested" && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      disabled={actionLoading[r.id]}
                      onClick={() => handleApprove(r.id)}
                    >
                      {actionLoading[r.id] ? "..." : "Chấp nhận"}
                    </Button>{" "}
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={actionLoading[r.id]}
                      onClick={() => handleReject(r.id)}
                    >
                      {actionLoading[r.id] ? "..." : "Từ chối"}
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default VehicleRegistrationListPage;
