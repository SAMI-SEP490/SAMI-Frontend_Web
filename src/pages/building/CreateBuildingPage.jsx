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
  const [billDueDay, setBillDueDay] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      alert("❌ Vui lòng nhập đầy đủ Tên và Địa chỉ");
      return;
    }

    if (!billDueDay) {
      alert("❌ Vui lòng nhập Ngày đóng tiền dịch vụ hàng tháng");
      return;
    }

    const day = parseInt(billDueDay);
    if (isNaN(day) || day < 1 || day > 31) {
      alert("❌ Ngày đóng tiền phải nằm trong khoảng từ 1 đến 31");
      return;
    }

    try {
      setSaving(true);
      await createBuilding({
        name,
        address,
        bill_due_day: day, // ✅ gửi lên backend
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

        {/* ===== BILL DUE DAY ===== */}
        <Row className="mt-3">
          <Col md={6}>
            <Form.Label>
              Ngày đóng tiền dịch vụ hàng tháng{" "}
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={31}
              value={billDueDay}
              placeholder="Ví dụ: 5"
              onChange={(e) => setBillDueDay(e.target.value)}
            />
            <Form.Text className="text-danger">
              ⚠ Sau khi tạo tòa nhà, ngày thanh toán sẽ{" "}
              <b>không thể chỉnh sửa</b>
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
