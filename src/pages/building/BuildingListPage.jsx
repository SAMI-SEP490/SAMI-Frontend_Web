import React, { useEffect, useState } from "react";
import { Table, Button, Row, Col, Form, Spinner } from "react-bootstrap";
import { colors } from "../../constants/colors";
import { useNavigate } from "react-router-dom";
import {
  listBuildings,
  getBuildingManagers,
  deleteBuilding,
} from "../../services/api/building";

function BuildingListPage() {
  const [buildings, setBuildings] = useState([]);
  const [managersMap, setManagersMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBuildings() {
      try {
        setLoading(true);
        const data = await listBuildings();
        setBuildings(data);

        const managersPromises = data.map(async (b) => {
          const mgrs = await getBuildingManagers(b.building_id);
          return [b.building_id, mgrs];
        });
        const results = await Promise.all(managersPromises);
        setManagersMap(Object.fromEntries(results));
      } catch (error) {
        console.error("Error fetching buildings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBuildings();
  }, []);

  const handleView = (id) => {
    navigate(`/buildings/${id}`);
  };
  const handleDelete = async (building_id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tòa nhà này vĩnh viễn?")) return;
    try {
      setLoading(true);
      await deleteBuilding(building_id);
      setBuildings((prev) => prev.filter((b) => b.building_id !== building_id));
    } catch (error) {
      console.error("Error deleting building:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/buildings/${id}/edit`);
  };

  const filteredBuildings = buildings.filter((b) => {
    const matchName = b.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? b.is_active
        : !b.is_active;

    return matchName && matchStatus;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 30,
        backgroundColor: colors.background,
      }}
    >
      <h4 style={{ fontWeight: "600", marginBottom: 20 }}>Quản lý tòa nhà</h4>

      {/* Bộ lọc */}
      <Row className="mb-3 align-items-end">
        <Col md={4}>
          <Form.Label>Tìm kiếm tòa nhà</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập tên tòa nhà..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>

        <Col md={3}>
          <Form.Label>Trạng thái</Form.Label>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </Form.Select>
        </Col>

        {/* Button Thêm tòa nhà */}
        <Col md={5} className="text-end">
          <Button
            variant="success"
            onClick={() => navigate("/buildings/create")}
          >
            + Thêm tòa nhà
          </Button>
        </Col>
      </Row>

      <Table bordered hover responsive>
        <thead style={{ backgroundColor: "#E6E8ED" }}>
          <tr>
            <th className="text-center">#</th>
            <th className="text-center">Tên tòa nhà</th>
            <th className="text-center">Địa chỉ</th>
            <th className="text-center">Ngày tạo</th>
            <th className="text-center">Quản lý tòa nhà</th>
            <th className="text-center">Trạng thái</th>
            <th className="text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="7" className="text-center">
                <Spinner animation="border" size="sm" /> Đang tải...
              </td>
            </tr>
          ) : filteredBuildings.length > 0 ? (
            filteredBuildings.map((b, index) => (
              <tr key={b.building_id}>
                <td className="text-center">{index + 1}</td>
                <td>{b.name}</td>
                <td>{b.address}</td>
                <td className="text-center">
                  {new Date(b.created_at).toLocaleDateString("vi-VN")}
                </td>
                <td>
                  {managersMap[b.building_id]
                    ? managersMap[b.building_id]
                        .map((m) => m.full_name)
                        .join(", ")
                    : "-"}
                </td>
                <td className="text-center">
                  {b.is_active ? (
                    <span style={{ color: "green", fontWeight: 500 }}>
                      Đang hoạt động
                    </span>
                  ) : (
                    <span style={{ color: "red", fontWeight: 500 }}>
                      Ngừng hoạt động
                    </span>
                  )}
                </td>
                <td className="text-center">
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleView(b.building_id)}
                  >
                    Xem
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(b.building_id)}
                  >
                    Sửa
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(b.building_id)}
                  >
                    Xóa
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">
                Không có tòa nhà nào
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default BuildingListPage;
