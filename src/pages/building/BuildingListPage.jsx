import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listBuildings,
  getBuildingManagers,
  deleteBuilding,
} from "../../services/api/building";
import { Eye, Pencil, Trash } from "react-bootstrap-icons";
import "./BuildingListPage.css";

export default function BuildingListPage() {
  const navigate = useNavigate();

  const [buildings, setBuildings] = useState([]);
  const [managersMap, setManagersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function fetchData() {
    try {
      setLoading(true);
      const data = await listBuildings();
      setBuildings(data || []);

      const managerPromises = data.map(async (b) => {
        const mgrs = await getBuildingManagers(b.building_id);
        return [b.building_id, mgrs];
      });

      const results = await Promise.all(managerPromises);
      setManagersMap(Object.fromEntries(results));
    } catch (err) {
      console.error(err);
      alert("❌ Lấy dữ liệu thất bại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa tòa nhà này?")) return;
    try {
      await deleteBuilding(id);
      alert("🗑️ Đã xóa tòa nhà.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("❌ Xóa thất bại.");
    }
  }

  const filtered = buildings.filter((b) => {
    const matchSearch = b.name?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === ""
        ? true
        : statusFilter === "active"
        ? b.is_active
        : !b.is_active;

    return matchSearch && matchStatus;
  });

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Danh sách Tòa Nhà</h2>

      {/* FILTER + ACTION */}
      <div className="filter-bar grid">
        <input
          type="text"
          placeholder="🔎 Tìm kiếm theo tên tòa nhà..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>

        <button
          className="btn add"
          onClick={() => navigate("/buildings/create")}
        >
          + Thêm Tòa Nhà
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="center">#</th>
              <th>Tên tòa nhà</th>
              <th>Địa chỉ</th>
              <th className="center">Ngày tạo</th>
              <th>Quản lý tòa nhà</th>
              <th className="center">Trạng thái</th>
              <th className="center action-col">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((b, index) => (
              <tr key={b.building_id}>
                <td className="center">{index + 1}</td>
                <td>{b.name}</td>
                <td>{b.address}</td>
                <td className="center">
                  {new Date(b.created_at).toLocaleDateString("vi-VN")}
                </td>
                <td>
                  {managersMap[b.building_id]?.length
                    ? managersMap[b.building_id]
                        .map((m) => m.full_name)
                        .join(", ")
                    : "—"}
                </td>
                <td className="center">
                  <span
                    className={`status ${
                      b.is_active ? "published" : "archived"
                    }`}
                  >
                    {b.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </span>
                </td>

                <td className="action-buttons">
                  <button
                    className="btn view"
                    onClick={() => navigate(`/buildings/${b.building_id}`)}
                  >
                    <Eye size={14} /> Xem
                  </button>

                  <button
                    className="btn edit"
                    onClick={() => navigate(`/buildings/${b.building_id}/edit`)}
                  >
                    <Pencil size={14} /> Sửa
                  </button>

                  <button
                    className="btn delete"
                    onClick={() => handleDelete(b.building_id)}
                  >
                    <Trash size={14} /> Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="no-data">Không có tòa nhà nào.</p>
        )}
      </div>
    </div>
  );
}
