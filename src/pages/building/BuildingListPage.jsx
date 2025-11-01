import React, { useEffect, useState } from "react";
import { Table, Button, Row, Col, Form, Spinner } from "react-bootstrap";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { useNavigate } from "react-router-dom";
import {
  listBuildings,
  getBuildingManagers,
  updateBuilding, // dùng cho edit
  toggleBuildingStatus, // có thể dùng nếu cần
  deleteBuilding, // dùng cho delete
} from "../../services/api/building";

function BuildingListPage() {
  const [buildings, setBuildings] = useState([]);
  const [managersMap, setManagersMap] = useState({}); // lưu danh sách managers theo building_id
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    async function fetchBuildings() {
      try {
        setLoading(true);
        const data = await listBuildings();
        setBuildings(data);

        // Lấy danh sách managers cho từng tòa nhà
        const managersPromises = data.map(async (b) => {
          const mgrs = await getBuildingManagers(b.building_id);
          return [b.building_id, mgrs];
        });
        const results = await Promise.all(managersPromises);
        const map = Object.fromEntries(results);
        setManagersMap(map);
      } catch (error) {
        console.error("Error fetching buildings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBuildings();
  }, []);

  const handleDelete = async (building_id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tòa nhà này vĩnh viễn?")) return;
    try {
      setLoading(true);
      await deleteBuilding(building_id);
      setBuildings((prev) => prev.filter((b) => b.building_id !== building_id));
      setManagersMap((prev) => {
        const copy = { ...prev };
        delete copy[building_id];
        return copy;
      });
    } catch (error) {
      console.error("Error deleting building:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/buildings/${id}/edit`);
  };

  const filteredBuildings = buildings.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Quản lý tòa nhà
          </h4>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Label>Tìm kiếm tòa nhà:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tên tòa nhà..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
          </Row>

          <Table bordered hover responsive>
            <thead style={{ backgroundColor: "#E6E8ED" }}>
              <tr>
                <th>#</th>
                <th>Tên tòa nhà</th>
                <th>Địa chỉ</th>
                <th>Ngày tạo</th>
                <th>Quản lý tòa nhà</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    <Spinner animation="border" size="sm" /> Đang tải...
                  </td>
                </tr>
              ) : filteredBuildings.length > 0 ? (
                filteredBuildings.map((b, index) => (
                  <tr key={b.building_id}>
                    <td>{index + 1}</td>
                    <td>{b.name}</td>
                    <td>{b.address}</td>
                    <td>
                      {new Date(b.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      {managersMap[b.building_id]
                        ? managersMap[b.building_id]
                            .map((m) => m.full_name)
                            .join(", ")
                        : "-"}
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(b.building_id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(b.building_id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    Không có tòa nhà nào
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default BuildingListPage;
