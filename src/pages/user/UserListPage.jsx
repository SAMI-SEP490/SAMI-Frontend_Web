// UserListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    listUsers,
    deleteUser,
    restoreUser
} from "../../services/api/users";
import { colors } from "../../constants/colors";
// Helper: lấy giá trị đầu tiên hợp lệ
const pick = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

// Chuẩn hóa user về 1 format thống nhất
const normalizeUser = (u) => {
  const id = pick(u?.user_id, u?.id, u?._id);

  return {
    id, // <-- CHỈ DÙNG FIELD NÀY TỪ GIỜ
    full_name: pick(u?.full_name, u?.name, ""),
    email: pick(u?.email, ""),
    role: pick(u?.role, ""),
    status: pick(u?.status, "active"),
    deleted_at: u?.deleted_at ?? null,
  };
};
export default function UserListPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await listUsers();
            const raw = Array.isArray(data) ? data : [];
setUsers(raw.map(normalizeUser));
        } finally {
            setLoading(false);
        }
    };

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

    const statusLabel = (u) => {
if (u?.status == "Deleted") return "Đã xóa";
        if (u?.status == "Inactive") return "Không hoạt động";
        return "Đang hoạt động";
    };

    const filteredUsers = useMemo(() => {
        return users
            .filter((u) => String(u?.role).toLowerCase() !== "owner")
            .filter((u) => {
                if (!search) return true;
                const s = search.toLowerCase();
                return (
                    u?.full_name?.toLowerCase().includes(s) ||
                    u?.email?.toLowerCase().includes(s)
                );
            })
            .filter((u) => {
                if (roleFilter === "all") return true;
                return String(u?.role).toLowerCase() === roleFilter;
            });
    }, [users, search, roleFilter]);
    const handleDelete = async (userId) => {
        if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;

        try {
            await deleteUser(userId);
            setUsers((prev) =>
  prev.map((u) =>
    u.id === userId
      ? { ...u, status: "inactive", deleted_at: new Date().toISOString() }
      : u
  )
);
        } catch (err) {
            console.error(err);
            alert("Xóa người dùng thất bại");
        }
    };
    const handleActivate = async (userId) => {
        if (!window.confirm("Kích hoạt lại người dùng này?")) return;

        try {
            await restoreUser(userId);

            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, status: "active" } : u
                )
            );
        } catch (err) {
            console.error(err);
            alert("Kích hoạt người dùng thất bại");
        }
    };
    return (
        <div className="contracts-container">
            <style>{`
        .contracts-container {
          padding: 24px 32px;
          background: #f8fafc;
          color: #0f172a;
          min-height: calc(100vh - 80px);
        }
        h1 { font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 20px; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
        .filter-grid { display: grid; grid-template-columns: 1fr 200px auto; gap: 12px; }
        .label { font-size: 13px; color: #475569; margin-bottom: 4px; }
        input, select { height: 38px; border: 1px solid #CBD5E1; border-radius: 8px; padding: 0 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 12px 16px; border-top: 1px solid #E5E7EB; }
        thead tr { background: #F1F5F9; }
        .btn-primary { background: ${colors.brand}; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-weight: 600; cursor: pointer; }
        .btn-link { background: none; border: none; padding: 4px 8px; cursor: pointer; color: #0ea5e9; font-weight: 600; }
      `}</style>

            <h1>Quản lý người dùng</h1>

            <div className="card">
                <div className="filter-grid">
                    <div>
                        <div className="label">Tìm theo tên hoặc email</div>
                        <input
                            placeholder="Nhập tên hoặc email"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="label">Vai trò</div>
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="all">Tất cả</option>
                            <option value="manager">Quản lý</option>
                            <option value="tenant">Người thuê</option>
                        </select>
                    </div>

                    <div style={{ alignSelf: "flex-end", textAlign: "right" }}>
                        <button className="btn-primary" onClick={() => navigate("/users/create")}>
                            + Tạo người dùng
                        </button>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan="5">Đang tải...</td></tr>
                        )}
                        {!loading && filteredUsers.length === 0 && (
                            <tr><td colSpan="5">Không có dữ liệu</td></tr>
                        )}
                        {filteredUsers.map((u) => (
                            <tr key={u.id}>
                                <td>{u.full_name}</td>
                                <td>{u.email}</td>
                                <td>{roleLabel(u.role)}</td>
                                <td>{statusLabel(u)}</td>
                                <td>
                                    <button type="button" className="btn-link" onClick={() => navigate(`/users/${u.id}`)}>Xem</button>
                                    <button type="button"className="btn-link" onClick={() => navigate(`/users/${u.id}/edit`)}>Sửa</button>
                                    {u.status === "Inactive" ? (
                                        <button type="button" className="btn-link" onClick={() => handleActivate(u.id)}>Kích hoạt</button>
                                    ) : (
                                        <button type="button" className="btn-link" onClick={() => handleDelete(u.id)}>Xóa</button>
                                    )}

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
