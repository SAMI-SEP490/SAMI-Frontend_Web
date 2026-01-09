import React, { useState, useEffect } from "react";
import { Table, Form, Button, Modal, Spinner } from "react-bootstrap";
import {
  listRooms,
  updateRoom,
  deactivateRoom,
  activateRoom,
} from "../../services/api/rooms";
import { getAccessToken } from "../../services/http";
import "./RoomListPage.css";
import {
  listBuildings,
  listAssignedBuildings,
} from "../../services/api/building";
import { useNavigate } from "react-router-dom";

function RoomListPage() {
  const [rooms, setRooms] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingIds, setLoadingIds] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  const handleAddTenant = (roomId) => {
    navigate(`/rooms/${roomId}/tenants`);
  };
  // ===== EXTRACT ROLE FROM JWT =====
  useEffect(() => {
    try {
      const token = getAccessToken();
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const role = decoded.role || decoded.userRole || "";
        setUserRole(role.toUpperCase());
        console.log("🔑 User Role from JWT:", role.toUpperCase());
      }
    } catch (error) {
      console.error("❌ Error parsing JWT:", error);
    }
  }, []);

  // ===== LOAD DATA =====
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await listRooms();
        setRooms(Array.isArray(data) ? data : data?.items ?? []);
        console.log("Loaded rooms:", data);
      } catch (error) {
        alert("❌ Lỗi khi tải dữ liệu phòng!");
        console.error(error);
      }
    }
    fetchData();
  }, []);

  // ===== LOAD BUILDINGS BY ROLE =====
  useEffect(() => {
    if (!userRole) return;

    async function fetchBuildingsByRole() {
      try {
        let data = [];

        if (userRole === "OWNER") {
          data = await listBuildings();
        } else if (userRole === "MANAGER") {
          data = await listAssignedBuildings();
        }

        const raw = Array.isArray(data) ? data : data?.items ?? [];

        const normalized = raw
          .map((b) => {
            // CASE 1: listBuildings (OWNER)
            if (b.building_id) {
              return {
                building_id: b.building_id,
                name: b.name,
              };
            }

            // CASE 2: listAssignedBuildings trả { id, name }
            if (b.id && b.name) {
              return {
                building_id: b.id,
                name: b.name,
              };
            }

            // CASE 3: listAssignedBuildings trả { building: {...} }
            if (b.building?.building_id) {
              return {
                building_id: b.building.building_id,
                name: b.building.name,
              };
            }

            return null;
          })
          .filter(Boolean);

        setBuildings(normalized);

        if (userRole === "MANAGER") {
          // Không set default filter, để user chọn
          setBuildingFilter("");
        }
      } catch (error) {
        alert("❌ Lỗi khi tải dữ liệu tòa nhà!");
        console.error("Lỗi load building theo role:", error);
      }
    }

    fetchBuildingsByRole();
  }, [userRole]);

  // ===== UTILS =====
  const getStatusLabel = (status) => {
    const statusMap = {
      available: "Sẵn sàng",
      occupied: "Đã cho thuê",
      maintenance: "Bảo trì",
      inactive: "Không hoạt động",
    };
    return statusMap[status] || status;
  };

  const getUniqueBuildings = () => {
    const buildings = [
      ...new Set(rooms.map((r) => r.building_name).filter(Boolean)),
    ];
    return buildings.sort();
  };
  const buildingMap = React.useMemo(() => {
    const map = {};
    buildings.forEach((b) => {
      map[b.building_id] = b.name;
    });
    return map;
  }, [buildings]);

  const getUniqueFloors = () => {
    const floors = [
      ...new Set(
        rooms.map((r) => r.floor).filter((f) => f !== null && f !== undefined)
      ),
    ];
    return floors.sort((a, b) => a - b);
  };

  const renderStatus = (status, isActive) => {
    if (!isActive) {
      return (
        <span className="status inactive-disabled">⊗ Không hoạt động</span>
      );
    }

    switch (status) {
      case "available":
        return (
          <span className="status active">✓ {getStatusLabel(status)}</span>
        );
      case "occupied":
        return (
          <span className="status occupied">👤 {getStatusLabel(status)}</span>
        );
      case "maintenance":
        return (
          <span className="status maintenance">⚙ {getStatusLabel(status)}</span>
        );
      case "inactive":
        return (
          <span className="status inactive">✗ {getStatusLabel(status)}</span>
        );
      default:
        return <span className="status">Không xác định</span>;
    }
  };

  // ===== HANDLERS =====
  const handleViewDetails = async (room) => {
    setSelectedRoom(room);
    setShowDetailModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editRoom?.room_id) {
      alert("ID phòng không hợp lệ!");
      return;
    }

    try {
      const roomId = editRoom.room_id;
      setLoadingIds((p) => [...p, roomId]);

      const updatedData = {
        room_number: editRoom.room_number,
        floor: editRoom.floor,
        size: editRoom.size,
      };

      await updateRoom(roomId, updatedData);
      setRooms((prev) =>
        prev.map((r) => (r.room_id === roomId ? editRoom : r))
      );
      setShowEditModal(false);
    } catch (error) {
      alert("❌ Lỗi khi cập nhật phòng!");
      console.error(error);
    } finally {
      setLoadingIds((p) => p.filter((i) => i !== editRoom.room_id));
    }
  };

  const handleToggleStatus = async (room) => {
    const roomId = room.room_id;
    try {
      setLoadingIds((p) => [...p, roomId]);

      if (room.is_active) {
        await deactivateRoom(roomId);
      } else {
        await activateRoom(roomId);
      }

      setRooms((prev) =>
        prev.map((r) =>
          r.room_id === roomId ? { ...r, is_active: !r.is_active } : r
        )
      );
    } catch (error) {
      alert("❌ Lỗi khi thay đổi trạng thái phòng!");
      console.error(error);
    } finally {
      setLoadingIds((p) => p.filter((i) => i !== roomId));
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom?.room_id) {
      alert("ID phòng không hợp lệ!");
      return;
    }

    try {
      // Assuming there's a deleteRoom API
      // await deleteRoom(selectedRoom.room_id);
      alert("Tính năng xóa phòng chưa được implement!");
      setShowDeleteModal(false);
    } catch (error) {
      alert("❌ Lỗi khi xóa phòng!");
      console.error(error);
    }
  };

  // ===== FILTER =====
  const filteredRooms = rooms.filter((room) => {
    const matchesStatus = statusFilter
      ? statusFilter === "inactive"
        ? !room.is_active
        : room.status === statusFilter && room.is_active
      : true;

    const matchesBuilding = buildingFilter
      ? room.building_name === buildingFilter ||
        String(room.building_id) === String(buildingFilter)
      : true;
    const matchesFloor = floorFilter
      ? room.floor === parseInt(floorFilter)
      : true;

    const term = searchTerm.toLowerCase();
    const roomNumber = String(room.room_number || "").toLowerCase();

    return (
      matchesStatus &&
      matchesBuilding &&
      matchesFloor &&
      roomNumber.includes(term)
    );
  });

  const canToggleStatus = (room) => {
    return room.status === "available" || room.status === "inactive";
  };

  const hasActiveFilters =
    statusFilter || buildingFilter || floorFilter || searchTerm;

  return (
    <div className="container">
      <h2 className="title">Quản lý Phòng</h2>

      {userRole === "MANAGER" && buildings.length > 0 && (
        <div
          style={{
            marginBottom: "12px",
            padding: "8px 12px",
            background: "#f0f6ff",
            border: "1px solid #c7dcff",
            borderRadius: "6px",
            fontWeight: 600,
            color: "#1e3a8a",
            width: "fit-content",
          }}
        >
          🏢 Tòa nhà đang quản lý:{" "}
          <span>{buildings.map((b) => b.name).join(", ")}</span>
        </div>
      )}
      {/* FILTER */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔎 Tìm theo số phòng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="status-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">✓ Sẵn sàng</option>
          <option value="occupied">👤 Đã cho thuê</option>
          <option value="maintenance">⚙ Bảo trì</option>
          <option value="inactive">⊗ Không hoạt động</option>
        </select>

        <select
          className="status-select"
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
        >
          <option value="">Tất cả tầng</option>
          {getUniqueFloors().map((floor) => (
            <option key={floor} value={floor}>
              Tầng {floor}
            </option>
          ))}
        </select>

        {userRole === "OWNER" && (
          <select
            className="status-select"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="">Tất cả tòa nhà</option>
            {buildings.map((b) => (
              <option key={b.building_id} value={String(b.building_id)}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        {userRole === "MANAGER" && buildings.length > 1 && (
          <select
            className="status-select"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            {buildings.map((b) => (
              <option key={b.building_id} value={String(b.building_id)}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <Button className="btn-reset" onClick={handleResetFilters} size="sm">
            🔄 Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              {userRole === "OWNER" && <th>Tòa nhà</th>}
              <th>Số phòng</th>
              <th>Tầng</th>
              <th>Diện tích (m²)</th>
              <th>Trạng thái</th>
              <th>Người ở</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filteredRooms.length === 0 && (
              <tr>
                <td colSpan={userRole === "OWNER" ? 8 : 7} className="no-data">
                  Không có phòng phù hợp
                </td>
              </tr>
            )}

            {filteredRooms.map((room, index) => {
              const roomId = room.room_id;
              const loading = loadingIds.includes(roomId);
              const rowClassName = !room.is_active ? "inactive-row" : "";

              return (
                <tr key={roomId} className={rowClassName}>
                  <td>{index + 1}</td>
                  {userRole === "OWNER" && (
                    <td style={{ textAlign: "center" }}>
                      {buildingMap[room.building_id] || "N/A"}
                    </td>
                  )}
                  <td>
                    <strong>{room.room_number || "N/A"}</strong>
                  </td>
                  <td>{room.floor || "N/A"}</td>
                  <td>{room.size || "N/A"}</td>
                  <td>{renderStatus(room.status, room.is_active)}</td>
                  <td style={{ textAlign: "center" }}>
                    {room.tenant_count || 0}
                  </td>

                  <td className="action-buttons">
                    <Button
                      size="sm"
                      className="btn view"
                      disabled={loading}
                      onClick={() => handleViewDetails(room)}
                    >
                      👁 Xem
                    </Button>
                    {room.status === "occupied" && room.is_active && (
                      <Button
                        size="sm"
                        className="btn publish"
                        onClick={() => handleAddTenant(room.room_id)}
                      >
                        ➕ Thêm người thuê
                      </Button>
                    )}
                    {canToggleStatus(room) && (
                      <Button
                        size="sm"
                        className={
                          room.is_active ? "btn delete" : "btn publish"
                        }
                        disabled={loading}
                        onClick={() => handleToggleStatus(room)}
                      >
                        {loading ? (
                          <Spinner size="sm" animation="border" />
                        ) : room.is_active ? (
                          "⊘ Tắt"
                        ) : (
                          "✓ Bật"
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {/* MODAL VIEW DETAILS */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        fullscreen="sm-down"
        backdrop={true}
        container={document.body}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            📌 Chi tiết phòng {selectedRoom?.room_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRoom && (
            <div className="detail-content">
              {userRole === "OWNER" && (
                <p>
                  <strong>Tòa nhà:</strong>{" "}
                  {selectedRoom.building_name || "N/A"}
                </p>
              )}
              <p>
                <strong>Số phòng:</strong> {selectedRoom.room_number}
              </p>
              <p>
                <strong>Tầng:</strong> {selectedRoom.floor || "N/A"}
              </p>
              <p>
                <strong>Diện tích:</strong> {selectedRoom.size || "N/A"} m²
              </p>
              <p>
                <strong>Trạng thái:</strong>{" "}
                {getStatusLabel(selectedRoom.status)}
              </p>
              <p>
                <strong>Trạng thái hoạt động:</strong>
                {selectedRoom.is_active ? (
                  <span className="status-active-badge"> ✓ Hoạt động</span>
                ) : (
                  <span className="status-inactive-badge">
                    {" "}
                    ⊗ Không hoạt động
                  </span>
                )}
              </p>
              <p>
                <strong>Số người ở:</strong> {selectedRoom.tenant_count || 0}
              </p>
              <p>
                <strong>Bảo trì đang chờ:</strong>{" "}
                {selectedRoom.pending_maintenance || 0}
              </p>

              {selectedRoom.tenants && selectedRoom.tenants.length > 0 && (
                <div>
                  <p>
                    <strong>Danh sách người ở:</strong>
                  </p>
                  <ul>
                    {selectedRoom.tenants.map((tenant, idx) => (
                      <li key={idx}>
                        {tenant.full_name} - {tenant.phone || "N/A"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedRoom.primary_tenant && (
                <>
                  <p>
                    <strong>Người ở chính:</strong>{" "}
                    {selectedRoom.primary_tenant.full_name}
                  </p>
                  <p>
                    <strong>Điện thoại:</strong>{" "}
                    {selectedRoom.primary_tenant.phone || "N/A"}
                  </p>
                </>
              )}
              <p>
                <strong>Ngày tạo:</strong>{" "}
                {selectedRoom.created_at
                  ? new Date(selectedRoom.created_at).toLocaleDateString(
                      "vi-VN"
                    )
                  : "N/A"}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL EDIT */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        container={document.body}
        backdrop={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>✏️ Chỉnh sửa phòng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editRoom && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tòa nhà</Form.Label>
                <Form.Control
                  type="text"
                  value={editRoom.building_name || ""}
                  disabled
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Số phòng</Form.Label>
                <Form.Control
                  type="text"
                  value={editRoom.room_number || ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, room_number: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Tầng</Form.Label>
                <Form.Control
                  type="number"
                  value={editRoom.floor || ""}
                  onChange={(e) =>
                    setEditRoom({
                      ...editRoom,
                      floor: parseInt(e.target.value),
                    })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Diện tích (m²)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={editRoom.size || ""}
                  onChange={(e) =>
                    setEditRoom({
                      ...editRoom,
                      size: parseFloat(e.target.value),
                    })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL DELETE CONFIRM */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        size="lg"
        container={document.body}
        backdrop={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa vĩnh viễn phòng này không? <br />
          <strong>Hành động này không thể hoàn tác!</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeleteRoom}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default RoomListPage;
