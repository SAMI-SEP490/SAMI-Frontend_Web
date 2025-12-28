// src/pages/building/EditBuildingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Button, Spinner, Row, Col, Badge } from "react-bootstrap";
import {
  updateBuilding,
  listBuildings,
  getBuildingManagers,
  removeManager,
} from "../../services/api/building";
import "./EditBuildingPage.css";

function EditBuildingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ===== PART 1 =====
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [managers, setManagers] = useState([]);

  // ===== PART 2 =====
  const [editService, setEditService] = useState(false);
  const [electricPrice, setElectricPrice] = useState(0);
  const [waterPrice, setWaterPrice] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [billDueDay, setBillDueDay] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const buildings = await listBuildings();
        const b = buildings.find((i) => i.building_id === parseInt(id));

        if (!b) {
          alert("Tòa nhà không tồn tại");
          return navigate("/buildings");
        }

        setBuilding(b);
        setName(b.name || "");
        setAddress(b.address || "");
        setElectricPrice(b.electric_unit_price ?? 0);
        setWaterPrice(b.water_unit_price ?? 0);
        setServiceFee(b.service_fee ?? 0);
        setBillDueDay(b.bill_due_day ?? "");

        const mgrs = await getBuildingManagers(b.building_id);
        setManagers(mgrs);
      } catch (err) {
        console.error(err);
        alert("❌ Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, navigate]);

  // ===== REMOVE MANAGER =====
  const handleRemoveManager = async (userId, fullName) => {
    if (!window.confirm(`Xóa ${fullName} khỏi tòa nhà?`)) return;
    try {
      await removeManager(building.building_id, userId);
      setManagers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      alert("❌ Không thể xóa quản lý");
    }
  };

  // ===== SAVE ALL =====
  const handleSaveAll = async () => {
    if (!name.trim() || !address.trim()) {
      return alert("Vui lòng nhập tên và địa chỉ");
    }

    try {
      setSaving(true);
      await updateBuilding(building.building_id, {
        name,
        address,
        electric_unit_price: Number(electricPrice),
        water_unit_price: Number(waterPrice),
        service_fee: Number(serviceFee),
        bill_due_day: billDueDay ? Number(billDueDay) : null,
      });

      alert("✅ Cập nhật tòa nhà thành công");
      navigate("/buildings");
    } catch (err) {
      console.error(err);
      alert("❌ Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !building) {
    return (
      <div className="loading-center">
        <Spinner animation="border" /> Đang tải...
      </div>
    );
  }

  return (
    <div className="edit-building-container">
      <h3 className="page-title">Chỉnh sửa tòa nhà</h3>

      {/* ================= PART 1 ================= */}
      <div className="section-card">
        <h5 className="section-title">Thông tin cơ bản</h5>

        <Row>
          <Col md={6}>
            <Form.Label>Tên tòa nhà</Form.Label>
            <Form.Control
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={6}>
            <Form.Label>Địa chỉ</Form.Label>
            <Form.Control
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Col>
        </Row>

        <div className="mt-3">
          <Form.Label>Quản lý tòa nhà</Form.Label>
          <div className="manager-list">
            {managers.length > 0 ? (
              managers.map((m) => (
                <Badge key={m.user_id} bg="secondary" className="manager-badge">
                  {m.full_name}
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveManager(m.user_id, m.full_name)}
                  >
                    ✕
                  </button>
                </Badge>
              ))
            ) : (
              <span className="empty-text">—</span>
            )}
          </div>
        </div>
      </div>

      {/* ================= PART 2 ================= */}
      <div className="section-card">
        <h5 className="section-title">Dịch vụ</h5>

        <Row>
          <Col md={3}>
            <label>Giá điện (VNĐ/số điện)</label>
            <input
              type="number"
              value={electricPrice}
              disabled={!editService}
              onChange={(e) => setElectricPrice(e.target.value)}
            />
          </Col>

          <Col md={3}>
            <label>Giá nước (VNĐ/khối nước)</label>
            <input
              type="number"
              value={waterPrice}
              disabled={!editService}
              onChange={(e) => setWaterPrice(e.target.value)}
            />
          </Col>

          <Col md={3}>
            <label>Giá dịch vụ khác (VNĐ)</label>
            <input
              type="number"
              value={serviceFee}
              disabled={!editService}
              onChange={(e) => setServiceFee(e.target.value)}
            />
          </Col>

          <Col md={3}>
            <label>Ngày đóng tiền hàng tháng (1-31)</label>
            <input
              type="number"
              min={1}
              max={31}
              placeholder="Chưa tạo"
              value={billDueDay}
              disabled={!editService}
              onChange={(e) => setBillDueDay(e.target.value)}
            />
          </Col>
        </Row>

        <div className="service-actions">
          {!editService ? (
            <Button
              variant="outline-primary"
              onClick={() => setEditService(true)}
            >
              Sửa dịch vụ
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setEditService(false)}>
              Hủy chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      {/* ================= SAVE ALL ================= */}
      <div className="page-actions">
        <Button variant="primary" onClick={handleSaveAll} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu toàn bộ"}
        </Button>

        <Button
          variant="secondary"
          onClick={() => navigate("/buildings")}
          disabled={saving}
        >
          Hủy
        </Button>
      </div>
    </div>
  );
}

export default EditBuildingPage;
