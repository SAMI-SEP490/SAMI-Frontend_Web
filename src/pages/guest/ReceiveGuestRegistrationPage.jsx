// src/pages/ReceiveGuestRegistrationPage.jsx
import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Badge, Form, Row, Col } from "react-bootstrap";
import {
  listGuestRegistrations,
  approveGuestRegistration,
  rejectGuestRegistration,
} from "../../services/api/guest";

export default function ReceiveGuestRegistrationPage() {
  const [guestRegistrations, setGuestRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Map trạng thái sang tiếng Việt
  const mapStatus = (status) => {
    switch (status) {
      case "approved":
        return "Chấp nhận";
      case "rejected":
        return "Từ chối";
      case "pending":
        return "Chờ xử lý";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  // Màu trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case "Chấp nhận":
        return "success";
      case "Từ chối":
        return "danger";
      case "Chờ xử lý":
        return "warning";
      case "Đã hủy":
        return "secondary";
      default:
        return "dark";
    }
  };

  // Fetch danh sách đăng ký
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await listGuestRegistrations();
      console.log("API response:", res);

      // Truy cập trực tiếp vào registrations
      const registrations = Array.isArray(res?.registrations)
        ? res.registrations
        : [];

      setGuestRegistrations(registrations);
      setFilteredRegistrations(registrations);

      console.log("Loaded guest registrations:", registrations);
    } catch (error) {
      console.error("Failed to load guest registrations:", error);
      setGuestRegistrations([]);
      setFilteredRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Phê duyệt
  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await approveGuestRegistration(id);
      setGuestRegistrations((prev) =>
        prev.map((item) =>
          item.registration_id === id ? { ...item, status: "approved" } : item
        )
      );
    } catch (error) {
      console.error("Approve error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  // Từ chối
  const handleReject = async (id) => {
    const reason = prompt("Lý do từ chối:");
    if (!reason) return;

    try {
      setProcessingId(id);
      const cancelledAt = new Date().toISOString();

      // Gọi API reject
      await rejectGuestRegistration(id, {
        cancellation_reason: reason,
        cancelled_at: cancelledAt,
      });

      // Cập nhật local
      setGuestRegistrations((prev) =>
        prev.map((item) =>
          item.registration_id === id
            ? {
                ...item,
                status: "rejected",
                cancelled_at: cancelledAt,
                cancelled_by: "Admin", // hoặc set tên người xử lý nếu backend trả về
                cancellation_reason: reason,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Reject error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  // Search & filter
  useEffect(() => {
    const filtered = guestRegistrations.filter((item) => {
      const nameMatch = item.tenants?.users?.full_name
        ?.toLowerCase()
        .includes(searchName.toLowerCase());
      const statusMatch = filterStatus
        ? mapStatus(item.status) === filterStatus
        : true;
      return nameMatch && statusMatch;
    });
    setFilteredRegistrations(filtered);
  }, [searchName, filterStatus, guestRegistrations]);

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Danh sách đăng ký khách</h3>

      {/* Search & Filter */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            placeholder="Tìm theo tên người gửi..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Chờ xử lý">Chờ xử lý</option>
            <option value="Chấp nhận">Chấp nhận</option>
            <option value="Từ chối">Từ chối</option>
            <option value="Đã hủy">Đã hủy</option>
          </Form.Select>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên người gửi</th>
              <th>Phòng</th>
              <th>Ngày tạo đơn</th>
              <th>Ngày vào</th>
              <th>Ngày ra</th>
              <th>Thông tin khách</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredRegistrations.map((item, index) => {
                const statusVN = mapStatus(item.status);
                return (
                  <tr key={item.registration_id}>
                    <td>{index + 1}</td>
                    <td>{item.tenants?.users?.full_name || "-"}</td>
                    <td>{item.rooms?.room_number || "-"}</td>
                    <td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {item.arrival_date
                        ? new Date(item.arrival_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {item.departure_date
                        ? new Date(item.departure_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {item.guest_details?.map((g) => (
                        <div key={g.detail_id}>
                          {g.full_name} - {g.id_number}
                        </div>
                      ))}
                    </td>
                    <td>
                      <Badge bg={getStatusColor(statusVN)}>{statusVN}</Badge>
                    </td>
                    <td>
                      {statusVN === "Chờ xử lý" && (
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            disabled={processingId === item.registration_id}
                            onClick={() => handleApprove(item.registration_id)}
                          >
                            {processingId === item.registration_id ? (
                              <Spinner size="sm" animation="border" />
                            ) : (
                              "Duyệt"
                            )}
                          </Button>

                          <Button
                            variant="danger"
                            disabled={processingId === item.registration_id}
                            onClick={() => handleReject(item.registration_id)}
                          >
                            {processingId === item.registration_id ? (
                              <Spinner size="sm" animation="border" />
                            ) : (
                              "Từ chối"
                            )}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
