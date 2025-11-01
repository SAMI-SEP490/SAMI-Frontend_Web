// src/pages/building/EditBuildingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Button, Spinner, Row, Col, Badge } from "react-bootstrap";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import {
  updateBuilding,
  listBuildings,
  getBuildingManagers,
  removeManager,
} from "../../services/api/building";

function EditBuildingPage() {
  const { id } = useParams(); // building_id từ URL
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Lấy thông tin tòa nhà + danh sách managers
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
        setName(b.name);
        setAddress(b.address);

        // Lấy danh sách managers
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

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      setSaving(true);
      await updateBuilding(building.building_id, { name, address });
      alert("Cập nhật tòa nhà thành công");
      navigate("/buildings");
    } catch (error) {
      console.error("Error updating building:", error);
      alert("Cập nhật tòa nhà thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveManager = async (userId, fullName) => {
    if (!window.confirm(`Xóa ${fullName} khỏi tòa nhà này?`)) return;
    try {
      setLoading(true);
      await removeManager(building.building_id, userId);
      setManagers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (error) {
      console.error("Error removing manager:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !building) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> Đang tải...
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ width: 220, backgroundColor: colors.brand }}>
          <Sidebar />
        </div>

        <div
          style={{ flex: 1, padding: 30, backgroundColor: colors.background }}
        >
          <h4 style={{ fontWeight: "600", marginBottom: 20 }}>
            Chỉnh sửa tòa nhà
          </h4>

          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Tên tòa nhà</Form.Label>
                <Form.Control
                  type="text"
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                        {m.full_name}{" "}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleRemoveManager(m.user_id, m.full_name)
                          }
                        >
                          Xóa
                        </Button>
                      </Badge>
                    ))
                  ) : (
                    <div>-</div>
                  )}
                </div>
              </Col>
            </Row>

            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
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
      </div>
    </div>
  );
}

export default EditBuildingPage;
