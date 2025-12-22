// src/pages/tenant/TenantListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllTenants,
  deleteTenantByUserId,
} from "../../services/api/tenants";
import { listRoomsLite } from "../../services/api/rooms";
import { Eye, Pencil, Trash } from "react-bootstrap-icons";
import "./TenantListPage.css";

/* ================= Helpers ================= */
const pick = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return undefined;
};

const normalizeTenant = (item) => {
  const user = pick(item?.user, item);
  const id = pick(user?.user_id, user?.id, item?._id);

  const name = pick(
    user?.full_name,
    [user?.first_name, user?.last_name].filter(Boolean).join(" "),
    "Người thuê"
  );

  return {
    id,
    name,
    email: pick(user?.email, ""),
    phone: pick(user?.phone, ""),
    avatar: pick(user?.avatar_url, ""),
    room: pick(item?.room?.room_number, item?.room, "—"),
  };
};

export default function TenantListPage() {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");

  /* ================= Fetch ================= */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getAllTenants();
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];
        setTenants(items.map(normalizeTenant));
      } catch {
        setError("Không tải được danh sách người thuê.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const rs = await listRoomsLite();
      setRooms(rs || []);
    })();
  }, []);

  /* ================= Filter ================= */
  const filteredTenants = useMemo(() => {
    const k = search.trim().toLowerCase();

    return tenants.filter((t) => {
      const matchRoom = roomFilter === "all" || t.room === roomFilter;
      const matchSearch =
        !k ||
        t.name.toLowerCase().includes(k) ||
        t.email.toLowerCase().includes(k) ||
        t.phone.toLowerCase().includes(k);

      return matchRoom && matchSearch;
    });
  }, [tenants, search, roomFilter]);

  /* ================= Actions ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa người thuê này?")) return;
    await deleteTenantByUserId(id);
    setTenants((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Danh sách người thuê</h2>

      {/* FILTER + ACTION */}
      <div className="filter-bar grid">
        <input
          className="search-input"
          placeholder="🔎 Tìm theo tên / email / SĐT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="status-select"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        >
          <option value="all">Tất cả phòng</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.label}>
              {r.label}
            </option>
          ))}
        </select>

        <button className="btn add" onClick={() => navigate("/tenants/create")}>
          + Thêm người thuê
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="center">#</th>
              <th className="center">Ảnh</th>
              <th>Tên</th>
              <th className="center">Phòng</th>
              <th>Email</th>
              <th className="center">SĐT</th>
              <th className="center action-col">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {error && (
              <tr>
                <td colSpan={7} className="center">
                  {error}
                </td>
              </tr>
            )}

            {filteredTenants.map((t, i) => (
              <tr key={t.id}>
                <td className="center">{i + 1}</td>
                <td className="center">
                  <img
                    className="avatar"
                    src={t.avatar || "https://placehold.co/40x40"}
                    alt=""
                  />
                </td>
                <td>{t.name}</td>
                <td className="center">{t.room}</td>
                <td>{t.email || "—"}</td>
                <td className="center">{t.phone || "—"}</td>

                <td className="action-buttons">
                  <button
                    className="btn view"
                    onClick={() => navigate(`/tenants/${t.id}`)}
                  >
                    <Eye size={14} /> Xem
                  </button>

                  <button
                    className="btn edit"
                    onClick={() => navigate(`/tenants/${t.id}/edit`)}
                  >
                    <Pencil size={14} /> Sửa
                  </button>

                  <button
                    className="btn delete"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash size={14} /> Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTenants.length === 0 && (
          <p className="no-data">Không có người thuê nào.</p>
        )}
      </div>
    </div>
  );
}
