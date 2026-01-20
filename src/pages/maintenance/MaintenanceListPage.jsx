import React, { useState, useEffect } from "react";
import { Table, Form, Button, Modal, Spinner } from "react-bootstrap";
import {
  listMaintenance,
  listUser,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  resolveMaintenanceRequest,
  completeMaintenanceRequest,
} from "../../services/api/maintenance";
import "./MaintenanceListPage.css";

function MaintenanceListPage() {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [userData, setUserData] = useState([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingIds, setLoadingIds] = useState([]);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // ===== LOAD DATA =====
  useEffect(() => {
    async function fetchData() {
      try {
        const [maintenance, users] = await Promise.all([
          listMaintenance(),
          listUser(),
        ]);
        setMaintenanceRequests(maintenance);
        setUserData(users);
      } catch {
        alert("❌ Lỗi khi tải dữ liệu!");
      }
    }
    fetchData();
  }, []);

  // ===== UTILS =====
  const getUserFullName = (id) => {
    const user = userData.find((u) => u.user_id === id);
    return user ? user.full_name : "Không rõ";
  };

  const renderStatus = (status) => {
    switch (status) {
      case "pending":
        return <span className="status draft">Chờ xử lý</span>;
      case "in_progress":
        return <span className="status published">Đang xử lý</span>;
      case "resolved":
        return <span className="status archived">Đã giải quyết</span>;
      case "completed":
        return <span className="status archived">Đã hoàn thành</span>;
      case "rejected":
        return <span className="status archived">Đã từ chối</span>;
      default:
        return <span className="status">Không xác định</span>;
    }
  };

  // ===== HANDLERS =====
  const handleApprove = async () => {
    try {
      setLoadingIds((p) => [...p, confirmId]);
      await approveMaintenanceRequest(confirmId);
      setMaintenanceRequests((prev) =>
        prev.map((r) =>
          r.request_id === confirmId ? { ...r, status: "in_progress" } : r,
        ),
      );
    } finally {
      setLoadingIds((p) => p.filter((i) => i !== confirmId));
      setShowConfirmModal(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      setLoadingIds((p) => [...p, id]);
      await resolveMaintenanceRequest(id);
      await completeMaintenanceRequest(id);
      setMaintenanceRequests((prev) =>
        prev.map((r) =>
          r.request_id === id ? { ...r, status: "completed" } : r,
        ),
      );
    } finally {
      setLoadingIds((p) => p.filter((i) => i !== id));
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lí do từ chối!");
      return;
    }

    try {
      setLoadingIds((p) => [...p, rejectId]);
      await rejectMaintenanceRequest(rejectId, rejectReason);
      setMaintenanceRequests((prev) =>
        prev.map((r) =>
          r.request_id === rejectId ? { ...r, status: "rejected" } : r,
        ),
      );
      setShowRejectModal(false);
    } finally {
      setLoadingIds((p) => p.filter((i) => i !== rejectId));
    }
  };

  // ===== FILTER =====
  const filteredRequests = maintenanceRequests.filter((req) => {
    const matchesStatus = statusFilter ? req.status === statusFilter : true;
    const term = searchTerm.toLowerCase();
    const name = getUserFullName(req.tenant_user_id).toLowerCase();

    return (
      matchesStatus &&
      (req.title.toLowerCase().includes(term) || name.includes(term))
    );
  });

  const hasActionColumn = filteredRequests.some(
    (req) => req.status === "pending" || req.status === "in_progress",
  );

  return (
    <div className="container">
      <h2 className="title">Danh sách yêu cầu bảo trì</h2>

      {/* FILTER */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔎 Tìm theo tiêu đề hoặc người gửi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="status-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="resolved">Đã giải quyết</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Tiêu đề</th>
              <th>Người gửi</th>
              <th>Phòng</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Ghi chú</th>
              {hasActionColumn && <th>Hành động</th>}
            </tr>
          </thead>

          <tbody>
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={hasActionColumn ? 8 : 7} className="no-data">
                  Không có yêu cầu phù hợp
                </td>
              </tr>
            )}

            {filteredRequests.map((req, index) => {
              const loading = loadingIds.includes(req.request_id);

              return (
                <tr key={req.request_id}>
                  <td>{index + 1}</td>
                  <td>{req.title}</td>
                  <td>{getUserFullName(req.tenant_user_id)}</td>
                  <td>{req.room_id}</td>
                  <td>{req.description || "-"}</td>
                  <td>{renderStatus(req.status)}</td>
                  <td>{req.note || "-"}</td>

                  {hasActionColumn && (
                    <td className="action-buttons">
                      {req.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="btn publish"
                            disabled={loading}
                            onClick={() => {
                              setConfirmId(req.request_id);
                              setShowConfirmModal(true);
                            }}
                          >
                            {loading ? (
                              <Spinner size="sm" animation="border" />
                            ) : (
                              "Chấp nhận"
                            )}
                          </Button>

                          <Button
                            size="sm"
                            className="btn delete"
                            disabled={loading}
                            onClick={() => {
                              setRejectId(req.request_id);
                              setRejectReason("");
                              setShowRejectModal(true);
                            }}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}

                      {req.status === "in_progress" && (
                        <Button
                          size="sm"
                          className="btn edit"
                          disabled={loading}
                          onClick={() => handleResolve(req.request_id)}
                        >
                          {loading ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            "Đã hoàn thành"
                          )}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {/* MODAL CONFIRM */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn chấp nhận yêu cầu bảo trì này không?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Hủy
          </Button>
          <Button variant="success" onClick={handleApprove}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL REJECT */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nhập lí do từ chối</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            as="textarea"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lí do từ chối..."
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleReject}>
            Từ chối
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MaintenanceListPage;
