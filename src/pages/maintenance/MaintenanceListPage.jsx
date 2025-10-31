import React, { useContext, useState, useEffect } from "react";
import { MaintenanceContext } from "../../contexts/MaintainanceContext";
import { Table, Form, Button, Row, Col } from "react-bootstrap";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { listMaintenance } from "../../services/api/maintainance";

function MaintenanceListPage() {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  console.log("maintenace : " + maintenanceRequests);

  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchMaintenance() {
      try {
        const data = await listMaintenance();
        console.log("Fetched maintenance:", data);
        setMaintenanceRequests(data);
      } catch (error) {
        console.error("Error fetching maintenance:", error);
      }
    }
    fetchMaintenance();
  }, []); // ✅ chỉ gọi 1 lần khi component mount

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
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Phòng</th>
                <th>Trạng thái</th>
                <th>Ưu tiên</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.request_id}>
                    <td>{req.request_id}</td>
                    <td>{req.title}</td>
                    <td>{req.room_id}</td>
                    <td>{req.status}</td>
                    <td>{req.priority}</td>
                    <td>
                      {new Date(req.created_at).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
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
