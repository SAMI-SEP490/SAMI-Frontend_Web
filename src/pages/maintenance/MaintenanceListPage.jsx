import React, { useState, useEffect } from "react";
import { Table, Form, Button, Row, Col, Modal, Spinner } from "react-bootstrap";
import { colors } from "../../constants/colors";
import {
  listMaintenance,
  listUser,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
} from "../../services/api/maintenance";

function MaintenanceListPage() {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);

  // Modal từ chối + modal xác nhận
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "approve" hoặc "reject"
  const [confirmId, setConfirmId] = useState(null);

  // Load dữ liệu
  useEffect(() => {
    async function fetchData() {
      try {
        const [maintenance, users] = await Promise.all([
          listMaintenance(),
          listUser(),
        ]);
        setMaintenanceRequests(maintenance);
        setUserData(users);
      } catch (error) {
        console.error("Error fetching data:", error.response?.data || error);
        alert("❌ Lỗi khi tải dữ liệu!");
      }
    }
    fetchData();
  }, []);

  const getUserFullName = (tenantUserId) => {
    const user = userData.find((u) => u.user_id === tenantUserId);
    return user ? user.full_name : "Không rõ";
  };

  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "in_progress":
        return "Đang xử lý";
      case "completed":
        return "Hoàn thành";
      case "rejected":
        return "Từ chối";
      default:
        return "Không xác định";
    }
  };

  const translatePriority = (priority) => {
    switch (priority) {
      case "low":
        return "Thấp";
      case "normal":
        return "Trung bình";
      case "high":
        return "Cao";
      default:
        return "Không xác định";
    }
  };

  // Xử lý Approve
  const handleApprove = async (id) => {
    try {
      setLoadingIds((prev) => [...prev, id]);
      await approveMaintenanceRequest(id);
      setMaintenanceRequests((prev) =>
        prev.map((req) =>
          req.request_id === id ? { ...req, status: "in_progress" } : req
        )
      );
      alert("✅ Đã phê duyệt yêu cầu bảo trì!");
    } catch (error) {
      console.error("Error approving request:", error.response?.data || error);
      alert(`❌ Lỗi khi phê duyệt! ${error.response?.data?.message || ""}`);
    } finally {
      setLoadingIds((prev) => prev.filter((i) => i !== id));
      setShowConfirmModal(false);
    }
  };

  // Xử lý Reject
  const handleReject = async (id) => {
    if (!rejectReason.trim()) return alert("Bạn phải nhập lý do từ chối!");
    try {
      setLoadingIds((prev) => [...prev, id]);
      await rejectMaintenanceRequest(id, rejectReason);
      setMaintenanceRequests((prev) =>
        prev.map((req) =>
          req.request_id === id ? { ...req, status: "rejected" } : req
        )
      );
      alert("🚫 Đã từ chối yêu cầu bảo trì!");
      setShowRejectModal(false);
    } catch (error) {
      console.error("Error rejecting request:", error.response?.data || error);
      alert(`❌ Lỗi khi từ chối! ${error.response?.data?.message || ""}`);
    } finally {
      setLoadingIds((prev) => prev.filter((i) => i !== id));
      setShowConfirmModal(false);
    }
  };

  // Mở modal xác nhận trước khi Approve hoặc Reject
  const openConfirmModal = (action, id) => {
    setConfirmAction(action);
    setConfirmId(id);
    if (action === "reject") {
      setRejectId(id);
      setRejectReason("");
      setShowRejectModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  // Filter + search theo tiêu đề và tên người gửi
  const filteredRequests = maintenanceRequests.filter((req) => {
    const matchesStatus = statusFilter ? req.status === statusFilter : true;
    const term = searchTerm.toLowerCase();
    const userName = getUserFullName(req.tenant_user_id).toLowerCase();
    const matchesSearch =
      req.title.toLowerCase().includes(term) || userName.includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        backgroundColor: colors.background,
      }}
    >
      <h4 style={{ fontWeight: 600, marginBottom: "20px" }}>
        Danh sách yêu cầu bảo trì
      </h4>

      <Row className="align-items-end mb-3">
        <Col md={3}>
          <Form.Label>Trạng thái:</Form.Label>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="pending">Chờ xử lý</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="rejected">Từ chối</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Label>Tìm kiếm:</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập tiêu đề hoặc người gửi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
      </Row>

      <Table bordered hover responsive>
        <thead style={{ backgroundColor: "#E6E8ED" }}>
          <tr>
            <th>#</th>
            <th>Tiêu đề</th>
            <th>Người gửi</th>
            <th>Phòng</th>
            <th>Trạng thái</th>
            <th>Ưu tiên</th>
            <th>Ngày tạo</th>
            <th>Ghi chú</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.length > 0 ? (
            filteredRequests.map((req, index) => {
              const isLoading = loadingIds.includes(req.request_id);
              const isPending = req.status === "pending";
              return (
                <tr key={req.request_id}>
                  <td>{index + 1}</td>
                  <td>{req.title}</td>
                  <td>{getUserFullName(req.tenant_user_id)}</td>
                  <td>{req.room_id}</td>
                  <td>{translateStatus(req.status)}</td>
                  <td>{translatePriority(req.priority)}</td>
                  <td>
                    {new Date(req.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td>{req.note || "—"}</td>
                  <td>
                    {isPending && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          className="me-2"
                          disabled={isLoading}
                          onClick={() =>
                            openConfirmModal("approve", req.request_id)
                          }
                        >
                          {isLoading ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            "Chấp nhận"
                          )}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isLoading}
                          onClick={() =>
                            openConfirmModal("reject", req.request_id)
                          }
                        >
                          Từ chối
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="9" className="text-center">
                Không có yêu cầu nào phù hợp
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Modal xác nhận Approve */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn phê duyệt yêu cầu này không?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Hủy
          </Button>
          <Button variant="success" onClick={() => handleApprove(confirmId)}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal nhập lý do Reject */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Lý do từ chối</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            as="textarea"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={() => handleReject(rejectId)}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MaintenanceListPage;
