import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Row, Col, Spinner } from "react-bootstrap";
import { colors } from "../../constants/colors";
import { createBuilding } from "../../services/api/building";

function CreateBuildingPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !address.trim()) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setSaving(true);
      await createBuilding({
        name,
        address,
      });
      alert("Tạo tòa nhà thành công");
      navigate("/buildings");
    } catch (error) {
      console.error("Error creating building:", error);
      alert("Tạo tòa nhà thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 30,
        backgroundColor: colors.background,
      }}
    >
      <h4 style={{ fontWeight: "600", marginBottom: 20 }}>Thêm tòa nhà mới</h4>

      <Form>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Tên tòa nhà</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập tên tòa nhà"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Địa chỉ</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập địa chỉ tòa nhà"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Col>
        </Row>

        <Button variant="success" onClick={handleCreate} disabled={saving}>
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              Đang tạo...
            </>
          ) : (
            "Tạo tòa nhà"
          )}
        </Button>

        <Button
          variant="secondary"
          className="ms-2"
          onClick={() => navigate("/buildings")}
          disabled={saving}
        >
          Hủy
        </Button>
      </Form>
    </div>
  );
}

export default CreateBuildingPage;
