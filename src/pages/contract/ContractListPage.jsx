import React, { useState, useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import { ContractContext } from "../../contexts/ContractContext";
import { Table, Form, Button, Row, Col, Container } from "react-bootstrap";
import { colors } from "../../constants/colors";
import Headers from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { useNavigate } from "react-router-dom";
function ContractListPage() {
  const { userData } = useContext(UserContext);
  const { contractData, setContractIdDetail } = useContext(ContractContext);

  const navigate = useNavigate();
  console.log("🧍 userData:", userData);
  console.log("📜 contractData:", contractData);

  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Lấy tên người thuê từ tenantId
  const getTenantName = (tenantId) => {
    const tenant = userData.find((user) => user.id === tenantId);
    return tenant ? tenant.full_name : "N/A";
  };

  // Lọc danh sách hợp đồng
  const filteredContracts = contractData.filter((contract) => {
    const matchesStatus = statusFilter
      ? contract.status.includes(statusFilter)
      : true;
    const matchesSearch =
      searchTerm === "" ||
      getTenantName(contract.tenantId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contract.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate =
      (!startDate || new Date(contract.startDate) >= new Date(startDate)) &&
      (!endDate || new Date(contract.endDate) <= new Date(endDate));

    return matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header cố định ở trên */}
      <div
        style={{
          marginBottom: 10,
          borderRadius: "10px",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Headers />
      </div>

      {/* Phần nội dung bên dưới header */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar cố định bên trái */}
        <div
          style={{
            width: "220px",
            backgroundColor: colors.brand,
            color: "white",
            height: "100%",
            position: "sticky",
            top: 0,
            borderRadius: "10px",
          }}
        >
          <Sidebar />
        </div>

        {/* Nội dung chính bên phải */}
        <div
          style={{
            flex: 1,
            padding: "30px",
            backgroundColor: colors.background,
            overflowY: "auto",
          }}
        >
          <h4 style={{ fontWeight: "600", marginBottom: "20px" }}>
            Danh Sách Hợp Đồng
          </h4>

          {/* Bộ lọc */}
          <Row className="align-items-end mb-3">
            <Col md={3}>
              <Form.Label>Trạng thái:</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Hết hạn">Hết hạn</option>
                <option value="Đã hủy">Đã hủy</option>
              </Form.Select>
            </Col>

            <Col md={4}>
              <Form.Label>Ngày:</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </Col>

            <Col md={3}>
              <Form.Label>Tìm kiếm:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tên hoặc mã hợp đồng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Button
                variant="primary"
                style={{
                  width: "100%",
                  backgroundColor: colors.brand,
                  border: "none",
                  marginTop: "5px",
                }}
              >
                Tìm
              </Button>
            </Col>
          </Row>

          {/* Bảng danh sách */}
          <Table bordered hover responsive>
            <thead style={{ backgroundColor: "#E6E8ED" }}>
              <tr>
                <th>ID Hợp Đồng</th>
                <th>Tên Người Thuê</th>
                <th>Số phòng</th>
                <th>Ngày Bắt Đầu</th>
                <th>Ngày Kết Thúc</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>{contract.id}</td>
                    <td>{getTenantName(contract.tenantId)}</td>
                    <td>{contract.room}</td>
                    <td>
                      {new Date(contract.startDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      {new Date(contract.endDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td>{contract.status}</td>
                    <td>
                      <span
                        style={{
                          color: colors.brand,
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                        onClick={() => {
                          setContractIdDetail(contract.id);
                          navigate(`/contracts/${contract.id}`);
                          console.log("hợp đồng : " + contract.id);
                        }}
                      >
                        Xem chi tiết
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    Không có hợp đồng nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Tải file và nút tạo hợp đồng */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
            }}
          >
            <div>
              <Form.Group controlId="formFile">
                <Form.Label style={{ fontWeight: "500" }}>
                  Chọn file:
                </Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control type="file" style={{ width: "250px" }} />
                  <Button
                    variant="primary"
                    style={{ backgroundColor: colors.brand, border: "none" }}
                  >
                    Tải lên
                  </Button>
                </div>
              </Form.Group>
            </div>

            <Button
              variant="primary"
              style={{
                backgroundColor: colors.brand,
                border: "none",
                padding: "10px 20px",
              }}
            >
              Tạo hợp đồng mới
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractListPage;
