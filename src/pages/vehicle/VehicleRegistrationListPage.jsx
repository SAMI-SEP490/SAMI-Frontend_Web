import React, { useEffect, useState } from "react";
import { Table, Button, Spinner } from "react-bootstrap";
import {
  listVehicleRegistrations,
  approveVehicleRegistration,
  rejectVehicleRegistration,
} from "../../services/api/vehicle";
import { getUserById } from "../../services/api/users";

const VEHICLE_TYPE_VN = {
  car: "Ô tô",
  motorcycle: "Xe máy",
  truck: "Xe tải",
  van: "Xe van",
  other: "Khác",
};

const STATUS_VN = {
  requested: "Đã yêu cầu",
  PENDING: "Đang chờ",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  pending: "Đang chờ",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
};

// 🔹 Hàm format ngày
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "N/A"; // check invalid date
  const pad = (n) => n.toString().padStart(2, "0");
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

function VehicleRegistrationListPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // 🔹 Fetch danh sách đăng ký xe
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await listVehicleRegistrations();
      const arr = Array.isArray(data?.registrations) ? data.registrations : [];

      const parsed = await Promise.all(
        arr.map(async (r) => {
          // Parse JSON reason
          let reason = {};
          try {
            reason = r.reason ? JSON.parse(r.reason) : {};
          } catch (e) {
            console.warn("Cannot parse reason JSON:", r.reason);
          }

          // Lấy full_name từ user API
          let requestedBy = "N/A";
          if (r.requested_by) {
            try {
              const user = await getUserById(r.requested_by);
              requestedBy = user?.full_name || r.requested_by;
            } catch (e) {
              console.warn("Cannot get user full_name:", r.requested_by);
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
            startDate: r.start_date || null,
            endDate: r.end_date || null,
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
    } catch (error) {
      console.error("Lỗi khi duyệt đăng ký:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await rejectVehicleRegistration(id);
      fetchRegistrations();
    } catch (error) {
      console.error("Lỗi khi từ chối đăng ký:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div>
      <h3>Danh sách đăng ký xe</h3>
      <Table striped bordered hover responsive>
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
          {registrations.map((r, index) => (
            <tr key={r.id}>
              <td>{index + 1}</td>
              <td>{r.requestedBy}</td>
              <td>{r.plateNumber}</td>
              <td>{VEHICLE_TYPE_VN[r.vehicleType] || r.vehicleType}</td>
              <td>{r.brand}</td>
              <td>{r.color}</td>
              <td>{formatDate(r.startDate)}</td>
              <td>{formatDate(r.endDate)}</td>
              <td>{STATUS_VN[r.status] || r.status}</td>
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
