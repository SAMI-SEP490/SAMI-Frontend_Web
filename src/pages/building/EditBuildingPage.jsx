// src/pages/building/EditBuildingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Button, Spinner, Row, Col, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  updateBuilding,
  getBuildingById,
  getBuildingManagers,
  checkBuildingEditable,
} from "../../services/api/building";
import "./EditBuildingPage.css";

function EditBuildingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ===== BASIC INFO =====
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [managers, setManagers] = useState([]);

  // ===== SERVICES =====
  const [editService, setEditService] = useState(false);
  const [electricPrice, setElectricPrice] = useState(0);
  const [waterPrice, setWaterPrice] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [billClosingDay, setBillClosingDay] = useState(""); 

  // State kiểm soát quyền sửa ngày chốt sổ
  const [isClosingDayEditable, setIsClosingDayEditable] = useState(false);
  const [closingDayReason, setClosingDayReason] = useState("");

  // ===== PARKING =====
  const [editParking, setEditParking] = useState(false);
  const [max4WheelSlot, setMax4WheelSlot] = useState(0);
  const [max2WheelSlot, setMax2WheelSlot] = useState(0);

  // ===== LOAD DATA =====
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const b = await getBuildingById(id);

        if (!b) {
          alert("Tòa nhà không tồn tại");
          return navigate("/buildings");
        }

        setBuilding(b);
        setName(b.name || "");
        setAddress(b.address || "");

        // Services
        setElectricPrice(b.electric_unit_price ?? 0);
        setWaterPrice(b.water_unit_price ?? 0);
        setServiceFee(b.service_fee ?? 0);
        setBillClosingDay(b.bill_closing_day ?? ""); 

        // Parking
        setMax4WheelSlot(b.max_4_wheel_slot ?? 0);
        setMax2WheelSlot(b.max_2_wheel_slot ?? 0);

        const mgrs = await getBuildingManagers(b.building_id);
        setManagers(mgrs);

        // Check Editable Status
        try {
            const checkRes = await checkBuildingEditable(b.building_id);
            // API trả về: { is_editable: boolean, reason: string }
            // Unwrap có thể trả về object hoặc data.data tùy wrapper, kiểm tra kỹ
            const status = checkRes.data || checkRes; 
            
            setIsClosingDayEditable(status.is_editable);
            setClosingDayReason(status.reason);
        } catch (e) {
            console.warn("Check editable failed:", e);
            setIsClosingDayEditable(false); // Default safe
            setClosingDayReason("Lỗi kiểm tra trạng thái.");
        }

      } catch (err) {
        console.error(err);
        alert("❌ Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, navigate]);

  // ===== SAVE =====
  const handleSaveAll = async () => {
    if (!name.trim() || !address.trim()) {
      return alert("Vui lòng nhập tên và địa chỉ");
    }

    try {
      setSaving(true);

      const payload = {
        name,
        address,
        electric_unit_price: Number(electricPrice),
        water_unit_price: Number(waterPrice),
        service_fee: Number(serviceFee),
        max_4_wheel_slot: Number(max4WheelSlot),
        max_2_wheel_slot: Number(max2WheelSlot),
      };

      // Chỉ gửi bill_closing_day nếu được phép sửa và người dùng đã nhập
      if (isClosingDayEditable && billClosingDay) {
          const day = parseInt(billClosingDay);
          if (day >= 1 && day <= 28) {
              payload.bill_closing_day = day;
          } else {
              return alert("Ngày chốt sổ phải từ 1-28");
          }
      }

      await updateBuilding(building.building_id, payload);

      alert("✅ Cập nhật tòa nhà thành công");
      navigate("/buildings");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "❌ Cập nhật thất bại";
      alert(`❌ ${msg}`);
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

      {/* BASIC INFO */}
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
            {managers.length > 0
              ? managers.map((m) => (
                <Badge key={m.user_id} bg="secondary" className="manager-badge">
                  {m.full_name}
                </Badge>
              ))
              : "—"}
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div className="section-card">
        <h5 className="section-title">Dịch vụ</h5>
        <Row>
          <Col md={3}>
            <label>Giá điện</label>
            <input
              type="number"
              value={electricPrice}
              disabled={!editService}
              onChange={(e) => setElectricPrice(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <label>Giá nước</label>
            <input
              type="number"
              value={waterPrice}
              disabled={!editService}
              onChange={(e) => setWaterPrice(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <label>Phí dịch vụ</label>
            <input
              type="number"
              value={serviceFee}
              disabled={!editService}
              onChange={(e) => setServiceFee(e.target.value)}
            />
          </Col>

          {/* Logic hiển thị Bill Closing Day */}
          <Col md={3}>
            <div className="d-flex align-items-center justify-content-between">
                <label className={isClosingDayEditable ? "" : "text-muted"}>
                    Ngày chốt sổ
                </label>
                {/* Tooltip giải thích nếu bị khóa */}
                {!isClosingDayEditable && (
                    <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>{closingDayReason}</Tooltip>}
                    >
                        <Badge bg="warning" text="dark" style={{cursor: 'help', fontSize: '10px'}}>
                            Đã khóa
                        </Badge>
                    </OverlayTrigger>
                )}
            </div>
            
            <input
              type="number"
              min="1"
              max="28"
              value={billClosingDay}
              // Disabled nếu: Không bật editService HOẶC API báo không được sửa
              disabled={!editService || !isClosingDayEditable} 
              style={(!isClosingDayEditable) ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
              onChange={(e) => setBillClosingDay(e.target.value)}
              title={!isClosingDayEditable ? closingDayReason : "Nhập ngày từ 1-28"}
            />
            {/* Hiển thị lý do chi tiết ở dưới nếu cần */}
            {!isClosingDayEditable && (
                <div className="form-text text-danger" style={{fontSize: '11px'}}>
                    {closingDayReason}
                </div>
            )}
          </Col>
        </Row>

        <Button
          style={{ marginTop: "10px" }}
          onClick={() => setEditService(!editService)}
        >
          {editService ? "Hủy" : "Sửa dịch vụ"}
        </Button>
      </div>

      {/* PARKING */}
      <div className="section-card">
        <h5 className="section-title">Bãi đỗ xe</h5>
        <Row>
          <Col md={3}>
            <label>Số xe 4 bánh</label>
            <input
              type="number"
              value={max4WheelSlot}
              disabled={!editParking}
              onChange={(e) => setMax4WheelSlot(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <label>Số xe 2 bánh</label>
            <input
              type="number"
              value={max2WheelSlot}
              disabled={!editParking}
              onChange={(e) => setMax2WheelSlot(e.target.value)}
            />
          </Col>
        </Row>
        <Button
          style={{ marginTop: "10px" }}
          onClick={() => setEditParking(!editParking)}
        >
          {editParking ? "Hủy" : "Sửa bãi đỗ"}
        </Button>
      </div>

      {/* SAVE */}
      <div className="page-actions">
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu"}
        </Button>
        <Button variant="secondary" onClick={() => navigate("/buildings")}>
          Hủy
        </Button>
      </div>
    </div>
  );
}

export default EditBuildingPage;
