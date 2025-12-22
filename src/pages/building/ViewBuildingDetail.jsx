import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Spinner, Row, Col, Badge, Button } from "react-bootstrap";
import { colors } from "../../constants/colors";
import {
  listBuildings,
  getBuildingManagers,
} from "../../services/api/building";

function ViewBuildingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBuilding() {
      try {
        setLoading(true);
        const data = await listBuildings();
        const b = data.find((item) => item.building_id === parseInt(id));
        if (!b) {
          alert("Tòa nhà không tồn tại");
          navigate("/buildings");
          return;
        }
        setBuilding(b);

        const mgrs = await getBuildingManagers(b.building_id);
        setManagers(mgrs);
      } catch (error) {
        console.error("Error fetching building:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBuilding();
  }, [id, navigate]);

  if (loading || !building) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> Đang tải...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 30,
        backgroundColor: colors.background,
      }}
    >
      <h4 style={{ fontWeight: "600", marginBottom: 20 }}>Chi tiết tòa nhà</h4>

      <Form>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Tên tòa nhà</Form.Label>
            <Form.Control type="text" value={building.name} disabled />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Địa chỉ</Form.Label>
            <Form.Control type="text" value={building.address} disabled />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Trạng thái</Form.Label>
            <Form.Control
              type="text"
              value={building.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
              disabled
            />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Quản lý tòa nhà</Form.Label>
            <div>
              {managers.length > 0 ? (
                managers.map((m) => (
                  <Badge
                    bg="secondary"
                    key={m.user_id}
                    className="me-2 mb-2"
                    style={{ padding: "0.5em 0.7em" }}
                  >
                    {m.full_name}
                  </Badge>
                ))
              ) : (
                <div>-</div>
              )}
            </div>
          </Col>
        </Row>

        <Button variant="secondary" onClick={() => navigate("/buildings")}>
          Quay lại
        </Button>
      </Form>
    </div>
  );
}

export default ViewBuildingDetail;
