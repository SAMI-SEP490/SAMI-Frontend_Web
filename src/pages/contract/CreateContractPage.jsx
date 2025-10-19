import React, { useState, useContext } from "react";
import { Button, Form, Row, Col, Container, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ContractContext } from "../../contexts/ContractContext";
import { UserContext } from "../../contexts/UserContext";
import { colors } from "../../constants/colors";

function CreateContractPage() {
  const { addContract } = useContext(ContractContext);
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();

  const [newContract, setNewContract] = useState({
    roomNumber: "",
    tenantId: "",
    startDate: "",
    endDate: "",
    deposit: "",
    monthlyRent: "",
    status: "Đang xử lý",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewContract({ ...newContract, [name]: value });
  };

  const handleSaveDraft = () => {
    const draft = { ...newContract, id: Date.now(), isDraft: true };
    addContract(draft); // thêm bản nháp vào context
    alert("Đã lưu bản nháp!");
    navigate("/contracts"); // về danh sách hợp đồng
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newData = { ...newContract, id: Date.now(), isDraft: false };
    addContract(newData); // thêm hợp đồng chính thức vào context
    alert("Tạo hợp đồng thành công!");
    navigate("/contracts"); // quay về danh sách hợp đồng
  };

  // Lọc ra người thuê trọ
  const tenants = userData.filter((u) => u.role === "Người thuê trọ");

  // Lấy avatar người thuê
  const selectedTenant = tenants.find(
    (tenant) => tenant.id === parseInt(newContract.tenantId)
  );

  return (
    <Container
      style={{
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: "10px",
        padding: "20px",
        maxWidth: "500px",
        marginTop: "40px",
      }}
    >
      <h5
        style={{
          backgroundColor: colors.brand,
          color: "#fff",
          display: "inline-block",
          padding: "5px 10px",
          borderRadius: "5px 5px 0 0",
        }}
      >
        Tạo hợp đồng
      </h5>

      <Form onSubmit={handleSubmit}>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Số phòng
          </Form.Label>
          <Col sm="8">
            <Form.Select
              name="roomNumber"
              value={newContract.roomNumber}
              onChange={handleChange}
              required
            >
              <option value="">Chọn phòng</option>
              <option value="101">101</option>
              <option value="102">102</option>
              <option value="103">103</option>
            </Form.Select>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Người thuê
          </Form.Label>
          <Col sm="8">
            <Form.Select
              name="tenantId"
              value={newContract.tenantId}
              onChange={handleChange}
              required
            >
              <option value="">Chọn người thuê</option>
              {tenants.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Form.Group>

        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <Image
            src={
              selectedTenant?.avatar_url ||
              "https://cdn-icons-png.flaticon.com/512/194/194938.png"
            }
            width="80"
            height="80"
            roundedCircle
          />
        </div>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Ngày bắt đầu
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type="date"
              name="startDate"
              value={newContract.startDate}
              onChange={handleChange}
              required
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Ngày kết thúc
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type="date"
              name="endDate"
              value={newContract.endDate}
              onChange={handleChange}
              required
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Tiền cọc
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type="text"
              name="deposit"
              value={newContract.deposit}
              onChange={handleChange}
              placeholder="4.000.000 vnd"
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Tiền thuê tháng
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type="text"
              name="monthlyRent"
              value={newContract.monthlyRent}
              onChange={handleChange}
              placeholder="10.000.000 vnd"
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Trạng thái
          </Form.Label>
          <Col sm="8">
            <Form.Select
              name="status"
              value={newContract.status}
              onChange={handleChange}
              required
            >
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Đang hiệu lực">Đang hiệu lực</option>
              <option value="Đã kết thúc">Đã kết thúc</option>
            </Form.Select>
          </Col>
        </Form.Group>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20px",
          }}
        >
          <Button variant="secondary" onClick={() => navigate("/contracts")}>
            Quay lại
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: colors.brand }}
            onClick={handleSaveDraft}
          >
            Lưu làm bản nháp
          </Button>
          <Button type="submit" variant="primary">
            Tạo
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default CreateContractPage;
