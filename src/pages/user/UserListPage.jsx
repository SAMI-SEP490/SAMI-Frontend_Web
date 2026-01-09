// src/pages/user/UserListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listBuildings } from "../../services/api/building";
import { listUsers, deleteUser, restoreUser } from "../../services/api/users";
import {
  Eye,
  Pencil,
  Trash,
  ArrowCounterclockwise,
} from "react-bootstrap-icons";
import "./UserListPage.css";
import { getAccessToken } from "../../services/http";

/* ================= Helpers ================= */
const pick = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return undefined;
};
const getRoleFromToken = () => {
  const token = getAccessToken();
  if (!token) return "";

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return String(payload?.role || "").toLowerCase();
  } catch {
    return "";
  }
};
const normalizeUser = (u) => {
  const id = pick(u?.user_id, u?.id, u?._id);
  return {
    id,
    full_name: pick(u?.full_name, u?.name, ""),
    email: pick(u?.email, ""),
    role: pick(u?.role, ""),
    status: pick(u?.status, "active"),
    building_id: u?.building_id ?? null,
    building_name: u?.building_name ?? null,
  };
};

export default function UserListPage() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [buildingFilter, setBuildingFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
const [currentUserRole, setCurrentUserRole] = useState("");
  /* ================= Fetch ================= */
useEffect(() => {
  setCurrentUserRole(getRoleFromToken());
}, []);
  useEffect(() => {
  (async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      setUsers((Array.isArray(data) ? data : []).map(normalizeUser));
    } finally {
      setLoading(false);
    }
  })();
}, []);
useEffect(() => {
  (async () => {
    const data = await listBuildings();
    setBuildings(Array.isArray(data) ? data : []);
  })();
}, []);
  /* ================= Labels ================= */
  const roleLabel = (role) => {
    switch (String(role).toLowerCase()) {
      case "manager":
        return "Quản lý";
      case "tenant":
        return "Người thuê";
      case "user":
        return "Người dùng";
      default:
        return role;
    }
  };

  const renderStatus = (u) => {
    if (u.status === "Inactive" || u.status === "inactive") {
      return <span className="status archived">Không hoạt động</span>;
    }
    if (u.status === "Deleted") {
      return <span className="status archived">Đã xóa</span>;
    }
    return <span className="status published">Đang hoạt động</span>;
  };

  /* ================= Filter ================= */
const filteredUsers = useMemo(() => {
  return users
    // Không hiển thị OWNER
    .filter((u) => String(u?.role).toLowerCase() !== "owner")

    // Search
    .filter((u) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
      );
    })

    // Role
    .filter((u) => {
      if (!roleFilter) return true;
      return String(u.role).toLowerCase() === roleFilter;
    })

    // Building (NEW)
      .filter((u) => {
  // MANAGER không filter theo building
  if (currentUserRole === "manager") return true;

  if (!buildingFilter) return true;
  if (!u.building_id) return true;

  return String(u.building_id) === String(buildingFilter);
});
}, [users, search, roleFilter, buildingFilter]);

  /* ================= Actions ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    await deleteUser(id);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "inactive" } : u))
    );
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Kích hoạt lại người dùng này?")) return;
    await restoreUser(id);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "active" } : u))
    );
  };

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Quản lý người dùng</h2>

      {/* FILTER + ACTION */}
      <div className="filter-bar filter-grid">
        <input
          className="search-input"
          placeholder="🔎 Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
{currentUserRole !== "manager" && (
  <select
    className="status-select"
    value={buildingFilter}
    onChange={(e) => setBuildingFilter(e.target.value)}
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
          className="status-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          {currentUserRole !== "manager" && (
          <option value="manager">Quản lý</option>
          )}
          <option value="tenant">Người thuê</option>
          <option value="user">Người dùng</option>
        </select>

        <button className="btn add" onClick={() => navigate("/users/create")}>
          + Tạo người dùng
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th className="center">Vai trò</th>
              <th className="center">Trạng thái</th>
              <th className="center action-col">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td className="center">{roleLabel(u.role)}</td>
                <td className="center">{renderStatus(u)}</td>
                <td className="action-buttons">
                  <button
                    className="btn view"
                    onClick={() => navigate(`/users/${u.id}`)}
                  >
                    <Eye size={14} /> Xem
                  </button>
{(String(u.role).toLowerCase() === "manager" && 
                  <button
                    className="btn edit"
                    onClick={() => navigate(`/users/${u.id}/edit`)}
                  >
                    <Pencil size={14} /> Sửa
                  </button>
)}
                  {u.status === "inactive" || u.status === "Inactive" ? (
                    <button
                      className="btn publish"
                      onClick={() => handleRestore(u.id)}
                    >
                      <ArrowCounterclockwise size={14} /> Kích hoạt
                    </button>
                  ) : (
                    <button
                      className="btn delete"
                      onClick={() => handleDelete(u.id)}
                    >
                      <Trash size={14} /> Xóa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <p className="no-data">Không có người dùng nào.</p>
        )}
      </div>
    </div>
  );
}
