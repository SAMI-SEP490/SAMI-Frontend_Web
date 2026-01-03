import React, { useEffect, useState, useMemo } from "react";
import {
  listParkingSlots,
  deleteParkingSlot,
  listBuildingsForParking,
} from "../../services/api/parking-slots";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash } from "react-bootstrap-icons";
import { getAccessToken } from "../../services/http";
import "./SlotListPage.css";

export default function SlotListPage() {
  const navigate = useNavigate();

  /* ================= AUTH ================= */
  const [role, setRole] = useState("");
  const [userBuildingId, setUserBuildingId] = useState(null);

  /* ================= DATA ================= */
  const [slots, setSlots] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FILTER ================= */
  const [search, setSearch] = useState("");
  const [ownerBuildingId, setOwnerBuildingId] = useState(""); // OWNER ONLY
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* ================= GET ROLE ================= */
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const decoded = JSON.parse(atob(token.split(".")[1]));
    setRole(decoded.role?.toUpperCase());
    setUserBuildingId(decoded.building_id || decoded.buildingId || null);
  }, []);

  /* ================= FETCH DATA ================= */
  async function fetchData() {
    try {
      setLoading(true);

      if (role === "OWNER") {
        const bRes = await listBuildingsForParking();
        setBuildings(bRes || []);
      }

      let params = {};
      if (role === "MANAGER" && userBuildingId) {
        params.building_id = userBuildingId;
      }

      const sRes = await listParkingSlots(params);
      setSlots(sRes?.slots || sRes || []);
    } catch (err) {
      console.error(err);
      alert("❌ Lấy dữ liệu thất bại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role) fetchData();
  }, [role, userBuildingId]);

  /* ================= DELETE ================= */
  async function handleDelete(slot) {
    if (!slot.is_available) return;

    if (!window.confirm("Bạn có chắc muốn xóa chỗ đỗ này?")) return;

    try {
      await deleteParkingSlot(slot.slot_id);
      alert("🗑️ Đã xóa chỗ đỗ.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("❌ Không thể xóa chỗ đỗ.");
    }
  }

  /* ================= FILTER ================= */
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const matchSearch = s.slot_number
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchBuilding =
        role === "OWNER" && ownerBuildingId
          ? s.building_id === Number(ownerBuildingId)
          : true;

      const matchType = typeFilter ? s.slot_type === typeFilter : true;

      const matchStatus =
        statusFilter === ""
          ? true
          : statusFilter === "available"
          ? s.is_available
          : !s.is_available;

      return matchSearch && matchBuilding && matchType && matchStatus;
    });
  }, [slots, search, ownerBuildingId, typeFilter, statusFilter, role]);

  /* ================= STATISTICS ================= */
  const statistics = useMemo(() => {
    const baseSlots =
      role === "OWNER" && ownerBuildingId
        ? slots.filter((s) => s.building_id === Number(ownerBuildingId))
        : slots;

    const total = baseSlots.length;
    const available = baseSlots.filter((s) => s.is_available).length;
    const used = total - available;

    return { total, available, used };
  }, [slots, ownerBuildingId, role]);

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Danh sách Chỗ Đỗ Xe</h2>

      {/* ================= STAT ================= */}
      <div className="stat-box">
        <span>📊 Tổng: {statistics.total}</span>
        <span className="available">🟢 Trống: {statistics.available}</span>
        <span className="unavailable">🔴 Đã dùng: {statistics.used}</span>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="🔎 Tìm theo mã chỗ đỗ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        {role === "OWNER" && (
          <select
            value={ownerBuildingId}
            onChange={(e) => setOwnerBuildingId(e.target.value)}
            className="status-select"
          >
            <option value="">Tất cả tòa nhà</option>
            {buildings.map((b) => (
              <option key={b.building_id} value={b.building_id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="status-select"
        >
          <option value="">Tất cả loại xe</option>
          <option value="two_wheeler">Xe máy</option>
          <option value="four_wheeler">Ô tô</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">Còn trống</option>
          <option value="unavailable">Đã sử dụng</option>
        </select>
      </div>

      {/* ================= TABLE ================= */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Mã chỗ đỗ</th>
              <th>Loại xe</th>
              <th>Trạng thái</th>
              <th className="action-col">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filteredSlots.map((slot, index) => (
              <tr key={slot.slot_id}>
                <td>{index + 1}</td>
                <td>{slot.slot_number}</td>
                <td>
                  {slot.slot_type === "two_wheeler" ? "Xe máy" : "Ô tô"}
                </td>
                <td>
                  <span
                    className={`status ${
                      slot.is_available ? "available" : "unavailable"
                    }`}
                  >
                    {slot.is_available ? "Còn trống" : "Đã sử dụng"}
                  </span>
                </td>
                <td className="action-buttons">
                  <button
                    className="btn edit"
                    onClick={() =>
                      navigate(`/parking-slots/${slot.slot_id}/edit`)
                    }
                  >
                    <Pencil size={14} /> Sửa
                  </button>

                  <button
                    className={`btn delete ${
                      !slot.is_available ? "disabled" : ""
                    }`}
                    disabled={!slot.is_available}
                    title={
                      !slot.is_available
                        ? "Không thể xóa slot đang được sử dụng"
                        : ""
                    }
                    onClick={() => handleDelete(slot)}
                  >
                    <Trash size={14} /> Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSlots.length === 0 && (
          <p className="no-data">Không có chỗ đỗ phù hợp.</p>
        )}
      </div>

      <div className="add-button">
        <button
          className="btn add"
          onClick={() => navigate("/parking-slots/create")}
        >
          + Thêm chỗ đỗ
        </button>
      </div>
    </div>
  );
}
