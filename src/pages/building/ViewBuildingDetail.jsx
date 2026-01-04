import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spinner, Row, Col, Badge } from "react-bootstrap";
import {
  getBuildingById,
  getBuildingManagers,
} from "../../services/api/building";
import "./EditBuildingPage.css"; // tái sử dụng CSS

function ViewBuildingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== LOAD DATA (GIỐNG HỆT EDIT) =====
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1️⃣ Lấy chi tiết tòa nhà
        const b = await getBuildingById(id);

        if (!b) {
          alert("Tòa nhà không tồn tại");
          navigate("/buildings");
          return;
        }

        setBuilding(b);

        // 2️⃣ Lấy quản lý – GIỐNG EDIT
        const mgrs = await getBuildingManagers(b.building_id);
        setManagers(mgrs);
      } catch (err) {
        console.error(err);
        alert("❌ Lỗi tải dữ liệu tòa nhà");
        navigate("/buildings");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, navigate]);

  if (loading || !building) {
    return (
      <div className="loading-center">
        <Spinner animation="border" /> Đang tải...
      </div>
    );
  }

  return (
    <div className="edit-building-container">
      <h3 className="page-title">Chi tiết tòa nhà</h3>

      {/* ================= THÔNG TIN CƠ BẢN ================= */}
      <div className="section-card">
        <h5 className="section-title">Thông tin cơ bản</h5>

        <Row>
          <Col md={6}>
            <label className="view-label">Tên tòa nhà</label>
            <div className="view-value">{building.name || "—"}</div>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={6}>
            <label className="view-label">Địa chỉ</label>
            <div className="view-value">{building.address || "—"}</div>
          </Col>
        </Row>

        <div className="mt-3">
          <label className="view-label">Quản lý tòa nhà</label>
          <div className="manager-list">
            {managers.length > 0 ? (
              managers.map((m) => (
                <Badge key={m.user_id} bg="secondary" className="manager-badge">
                  {m.full_name}
                </Badge>
              ))
            ) : (
              <span className="empty-text">—</span>
            )}
          </div>
        </div>
      </div>

      {/* ================= DỊCH VỤ ================= */}
      <div className="section-card">
        <h5 className="section-title">Dịch vụ</h5>

        <Row>
          <Col md={3}>
            <label className="view-label">Giá điện</label>
            <div className="view-value">
              {building.electric_unit_price ?? 0} VNĐ
            </div>
          </Col>

          <Col md={3}>
            <label className="view-label">Giá nước</label>
            <div className="view-value">
              {building.water_unit_price ?? 0} VNĐ
            </div>
          </Col>

          <Col md={3}>
            <label className="view-label">Phí dịch vụ</label>
            <div className="view-value">{building.service_fee ?? 0} VNĐ</div>
          </Col>

          <Col md={3}>
            <label className="view-label">Ngày đóng tiền</label>
            <div className="view-value">
              {building.bill_due_day
                ? `Ngày ${building.bill_due_day}`
                : "Chưa thiết lập"}
            </div>
          </Col>
        </Row>
      </div>

      {/* ================= BÃI ĐỖ XE ================= */}
      <div className="section-card">
        <h5 className="section-title">Bãi đỗ xe</h5>

        <Row>
          <Col md={3}>
            <label className="view-label">Xe 4 bánh</label>
            <div className="view-value">{building.max_4_wheel_slot ?? 0}</div>
          </Col>

          <Col md={3}>
            <label className="view-label">Xe 2 bánh</label>
            <div className="view-value">{building.max_2_wheel_slot ?? 0}</div>
          </Col>
        </Row>
      </div>

      {/* ================= ACTION ================= */}
      <div className="page-actions">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/buildings")}
        >
          Quay lại
        </button>
      </div>
    </div>
  );
}

export default ViewBuildingDetail;
