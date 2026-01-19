// src/pages/building/CreateBuildingPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Row, Col, Spinner } from "react-bootstrap";
import { createBuilding } from "../../services/api/building";
import "./EditBuildingPage.css";

function CreateBuildingPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [billClosingDay, setBillClosingDay] = useState("");
  
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validate cơ bản
    if (!name.trim() || !address.trim() || !billClosingDay) {
      alert("❌ Vui lòng nhập đầy đủ: Tên, Địa chỉ và Ngày chốt sổ.");
      return;
    }

    const day = parseInt(billClosingDay);
    if (isNaN(day) || day < 1 || day > 28) {
        alert("❌ Ngày chốt sổ phải từ 1 đến 28.");
        return;
    }

    try {
      setSaving(true);
      await createBuilding({
        name,
        address,
        bill_closing_day: day, // [NEW] Gửi lên API
        electric_unit_price: null,
        water_unit_price: null,
      });

      alert("✅ Tạo tòa nhà thành công");
      navigate("/buildings");
    } catch (err) {
      console.error(err);
      alert(err?.message || "❌ Tạo tòa nhà thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-building-container">
      <h3 className="page-title">Thêm tòa nhà mới</h3>

      {/* ===== THÔNG TIN CƠ BẢN ===== */}
      <div className="section-card">
        <h5 className="section-title">Thông tin cơ bản</h5>

        <Row>
          <Col md={6}>
            <Form.Label>
              Tên tòa nhà <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              value={name}
              placeholder="Nhập tên tòa nhà"
              onChange={(e) => setName(e.target.value)}
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={6}>
            <Form.Label>
              Địa chỉ <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              value={address}
              placeholder="Nhập địa chỉ tòa nhà"
              onChange={(e) => setAddress(e.target.value)}
            />
          </Col>
        </Row>

        {/* [NEW] Thêm trường Ngày chốt sổ */}
        <Row className="mt-3">
            <Col md={3}>
                <Form.Label>Ngày chốt sổ (1-28) <span className="text-danger">*</span></Form.Label>
                <Form.Control
                    type="number"
                    min="1"
                    max="28"
                    value={billClosingDay}
                    placeholder="VD: 15"
                    onChange={(e) => setBillClosingDay(e.target.value)}
                />
                <Form.Text className="text-muted">
                    Ngày dùng để chốt điện nước hàng tháng.
                </Form.Text>
            </Col>
        </Row>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="page-actions">
        <Button
          variant="secondary"
          onClick={() => navigate("/buildings")}
          disabled={saving}
        >
          Hủy
        </Button>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              Đang lưu...
            </>
          ) : (
            "Lưu tòa nhà"
          )}
        </Button>
      </div>
    </div>
  );
}

export default CreateBuildingPage;
