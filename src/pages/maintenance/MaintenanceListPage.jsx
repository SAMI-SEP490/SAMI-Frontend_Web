import React, { useState, useEffect } from "react";
import { Table, Form, Button, Row, Col } from "react-bootstrap";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import {
  listMaintenance,
  listUser,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
} from "../../services/api/maintainance";

function MaintenanceListPage() {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dataMaintenance, dataUsers] = await Promise.all([
          listMaintenance(),
          listUser(),
        ]);
        console.log("Fetched maintenance:", dataMaintenance);
        console.log("Fetched users:", dataUsers);
        setMaintenanceRequests(dataMaintenance);
        setUserData(dataUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, []);

  const getUserFullName = (tenantUserId) => {
    const user = userData.find((u) => u.user_id === tenantUserId);
    return user ? user.full_name : "Không rõ";
  };

  // ✅ Phê duyệt yêu cầu
  const handleApprove = async (id) => {
    try {
      setLoading(true);
      await approveMaintenanceRequest(id);
      setMaintenanceRequests((prev) =>
        prev.map((req) =>
          req.request_id === id ? { ...req, status: "in_progress" } : req
        )
      );
      alert("✅ Đã phê duyệt yêu cầu bảo trì!");
    } catch (error) {
      console.error("Error approving request:", error);
      alert("❌ Lỗi khi phê duyệt yêu cầu!");
    } finally {
      setLoading(false);
    }
  };

  // ❌ Từ chối yêu cầu
  const handleReject = async (id) => {
    const reason = prompt("Nhập lý do từ chối (bắt buộc):");
    if (!reason) return alert("Bạn phải nhập lý do từ chối!");
    try {
      setLoading(true);
      await rejectMaintenanceRequest(id, reason);
      setMaintenanceRequests((prev) =>
        prev.map((req) =>
          req.request_id === id ? { ...req, status: "rejected" } : req
        )
      );
      alert("🚫 Đã từ chối yêu cầu bảo trì!");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("❌ Lỗi khi từ chối yêu cầu!");
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = maintenanceRequests.filter((req) => {
    const matchesStatus = statusFilter ? req.status === statusFilter : true;
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.request_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ width: 220, backgroundColor: colors.brand }}>
          <Sidebar />
        </div>
        <div
          style={{ flex: 1, padding: 30, backgroundColor: colors.background }}
        >
          <h4 style={{ fontWeight: "600", marginBottom: "20px" }}>
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
                placeholder="Nhập tiêu đề hoặc ID..."
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
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req, index) => (
                  <tr key={req.request_id}>
                    <td>{index + 1}</td>
                    <td>{req.title}</td>
                    <td>{getUserFullName(req.tenant_user_id)}</td>
                    <td>{req.room_id}</td>
                    <td>{req.status}</td>
                    <td>{req.priority}</td>
                    <td>
                      {new Date(req.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        className="me-2"
                        disabled={
                          loading ||
                          req.status === "in_progress" ||
                          req.status === "completed"
                        }
                        onClick={() => handleApprove(req.request_id)}
                      >
                        Chấp nhận
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={loading || req.status === "rejected"}
                        onClick={() => handleReject(req.request_id)}
                      >
                        Từ chối
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    Không có yêu cầu nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default MaintenanceListPage;
