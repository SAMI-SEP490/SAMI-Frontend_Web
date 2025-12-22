// src/pages/user/UserListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listUsers, deleteUser, restoreUser } from "../../services/api/users";
import {
  Eye,
  Pencil,
  Trash,
  ArrowCounterclockwise,
} from "react-bootstrap-icons";
import "./UserListPage.css";

/* ================= Helpers ================= */
const pick = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return undefined;
};

const normalizeUser = (u) => {
  const id = pick(u?.user_id, u?.id, u?._id);
  return {
    id,
    full_name: pick(u?.full_name, u?.name, ""),
    email: pick(u?.email, ""),
    role: pick(u?.role, ""),
    status: pick(u?.status, "active"),
  };
};

export default function UserListPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  /* ================= Fetch ================= */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listUsers();
        const raw = Array.isArray(data) ? data : [];
        setUsers(raw.map(normalizeUser));
      } finally {
        setLoading(false);
      }
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
      .filter((u) => String(u?.role).toLowerCase() !== "owner")
      .filter((u) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          u.full_name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
        );
      })
      .filter((u) => {
        if (!roleFilter) return true;
        return String(u.role).toLowerCase() === roleFilter;
      });
  }, [users, search, roleFilter]);

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
      <div className="filter-bar grid">
        <input
          className="search-input"
          placeholder="🔎 Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="status-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="manager">Quản lý</option>
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

                  <button
                    className="btn edit"
                    onClick={() => navigate(`/users/${u.id}/edit`)}
                  >
                    <Pencil size={14} /> Sửa
                  </button>

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
