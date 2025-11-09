import React, { useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ContractContext } from "../../contexts/ContractContext";
import { UserContext } from "../../contexts/UserContext";
import { Card, Form, Button } from "react-bootstrap";
import { colors } from "../../constants/colors";

export default function ContractAddendumPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contractData, appendices, setappendices } =
    useContext(ContractContext);
  const { userData } = useContext(UserContext);

  const contract = contractData.find((item) => String(item.id) === String(id));
  const tenant = userData.find((u) => u.id === contract?.tenantId);

  const [formData, setFormData] = useState({
    type: "Đổi giá thuê",
    content: "",
    effectiveDate: "",
    status: "Đang xử lý",
  });

  if (!contract) {
    return (
      <div style={{ padding: "40px" }}>
        <h4>Không tìm thấy hợp đồng</h4>
        <Button variant="secondary" onClick={() => navigate("/contracts")}>
          Quay lại
        </Button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (isDraft) => {
    const newAppendix = {
      id: `PL-${String(appendices.length + 1).padStart(3, "0")}`,
      contractId: contract.id,
      ...formData,
      status: isDraft ? "Bản nháp" : formData.status,
    };

    setappendices([...appendices, newAppendix]);
    alert(isDraft ? "Đã lưu bản nháp" : "Tạo phụ lục thành công!");
    navigate(`/contracts/${contract.id}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        backgroundColor: colors.background,
        overflowY: "auto",
      }}
    >
      <h4 style={{ fontWeight: "600", marginBottom: "20px" }}>Tạo Phụ Lục</h4>

      {/* Thông tin hợp đồng */}
      <Card
        style={{
          marginBottom: "25px",
          border: "1px solid #ccc",
          borderRadius: "10px",
        }}
      >
        <Card.Header
          style={{
            backgroundColor: colors.brand,
            color: "white",
            fontWeight: "500",
          }}
        >
          Thông tin hợp đồng
        </Card.Header>
        <Card.Body>
          <div className="row mb-2">
            <div className="col-md-6">
              <strong>Hợp đồng số:</strong> {contract.id}
            </div>
            <div className="col-md-6">
              <strong>Tên người thuê:</strong>{" "}
              <span
                style={{ color: colors.brand, cursor: "pointer" }}
                onClick={() => navigate(`/tenants/${tenant?.id}`)}
              >
                {tenant?.full_name || "N/A"}
              </span>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-md-6">
              <strong>Số phòng:</strong> {contract.room}
            </div>
            <div className="col-md-6">
              <strong>Ngày bắt đầu:</strong>{" "}
              {new Date(contract.startDate).toLocaleDateString("vi-VN")}
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-md-6">
              <strong>Ngày kết thúc:</strong>{" "}
              {new Date(contract.endDate).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Form tạo phụ lục */}
      <Card
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
        }}
      >
        <Card.Header
          style={{
            backgroundColor: colors.brand,
            color: "white",
            fontWeight: "500",
          }}
        >
          Tạo phụ lục
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Phân loại</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option>Đổi giá thuê</option>
                <option>Gia hạn</option>
                <option>Thay đổi điều khoản</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nội dung</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Nhập nội dung phụ lục..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ngày hiệu lực</Form.Label>
              <Form.Control
                type="date"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option>Đang xử lý</option>
                <option>Đang hiệu lực</option>
                <option>Chưa hiệu lực</option>
                <option>Đã hết hiệu lực</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Quay lại
              </Button>
              <div className="d-flex gap-2">
                <Button
                  variant="warning"
                  onClick={() => handleSave(true)}
                  style={{ color: "white" }}
                >
                  Lưu làm bản nháp
                </Button>
                <Button
                  style={{
                    backgroundColor: colors.brand,
                    border: "none",
                  }}
                  onClick={() => handleSave(false)}
                >
                  Tạo
                </Button>
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
