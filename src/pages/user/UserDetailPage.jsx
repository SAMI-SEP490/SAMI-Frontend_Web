import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById } from "../../services/api/users";
import { colors } from "../../constants/colors";

// helper
const pick = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return undefined;
};
const normalizeTenant = (u) => ({
  room: u?.room_name || "—", // service đã map sẵn
  idNumber: u?.id_number || "—",
  tenantSince: u?.tenant_since || null,
  note: u?.note || "—",
});

const normalizeManager = (u) => ({
  building: u?.building_name || `Tòa nhà #${u?.building_id ?? "—"}`,
  note: u?.note || "—",
});


// normalize giống UserListPage
const normalizeUser = (u) => ({
  id: pick(u?.user_id, u?.id, u?._id),
  full_name: pick(u?.full_name, u?.name, "—"),
  email: pick(u?.email, "—"),
  phone: pick(u?.phone, u?.phone_number, "—"),
  role: pick(u?.role, "—"),
  status: pick(u?.status, "active"),
  gender: pick(u?.gender, "—"),
  birthday: pick(u?.birthday, "—"),
  deleted_at: u?.deleted_at ?? null,
});
const formatDateVN = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};const genderLabel = (g) => {
  switch (String(g).toLowerCase()) {
    case "male":
      return "Nam";
    case "female":
      return "Nữ";
    case "other":
      return "Khác";
    default:
      return "—";
  }
};
export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getUserById(id);
        if (!mounted) return;
        const normalized = normalizeUser(data);

if (String(normalized.role).toLowerCase() === "tenant") {
  normalized.tenant = normalizeTenant(data);
}

if (String(normalized.role).toLowerCase() === "manager") {
  normalized.manager = normalizeManager(data);
}

setUser(normalized);
console.log("RAW USER", data);
      } catch (e) {
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Không lấy được thông tin người dùng"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [id]);

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
    if (u?.status === "Deleted") return "Đã xóa";
    if (u?.status === "Inactive") return "Không hoạt động";
    return "Đang hoạt động";
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (err) return <div style={{ padding: 24, color: "#E11D48" }}>{err}</div>;
  if (!user) return null;
const isManager = String(user.role).toLowerCase() === "manager";

  return (
    <div className="user-detail-page">
      <style>{`
        .user-detail-page {
          padding: 24px 32px;
          background: #f8fafc;
background: #f8fafc;
display: flex;
 align-items: center;
 justify-content: center;
        }
        h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px 24px;
         
        }
        .row {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        .label {
          color: #475569;
          font-size: 14px;
        }
        .value {
          font-weight: 600;
        }
        .actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        .btn {
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .btn-primary {
          background: ${colors.brand};
          color: #fff;
        }
        .btn-gray {
          background: #e5e7eb;
        }
      `}</style>
<div>
      <h1 style={{ textAlign: "center" }}>Chi tiết người dùng</h1>

      <div className="card">
        <div className="row">
          <div className="label">ID</div>
          <div className="value">{user.id}</div>
        </div>

        <div className="row">
          <div className="label">Họ tên</div>
          <div className="value">{user.full_name}</div>
        </div>

        <div className="row">
          <div className="label">Email</div>
          <div className="value">{user.email}</div>
        </div>

        <div className="row">
          <div className="label">Số điện thoại</div>
          <div className="value">{user.phone}</div>
        </div>

        <div className="row">
          <div className="label">Vai trò</div>
          <div className="value">{roleLabel(user.role)}</div>
        </div>

        <div className="row">
          <div className="label">Trạng thái</div>
          <div className="value">{statusLabel(user)}</div>
        </div>

        <div className="row">
          <div className="label">Giới tính</div>
          <div className="value">{genderLabel(user.gender)}</div>
        </div>

        <div className="row">
          <div className="label">Ngày sinh</div>
          <div className="value">{formatDateVN(user.birthday)}</div>
        </div>
{user.role.toLowerCase() === "tenant" && user.tenant && (
  <>
    <h3 style={{ marginTop: 24 }}>Thông tin người thuê</h3>

    <div className="row">
      <div className="label">Tòa nhà</div>
      <div className="value">{user.tenant.building}</div>
    </div>

    <div className="row">
      <div className="label">CCCD / CMND</div>
      <div className="value">{user.tenant.idNumber}</div>
    </div>

    <div className="row">
      <div className="label">Ghi chú</div>
      <div className="value">{user.tenant.note}</div>
    </div>
  </>
)}
{user.role.toLowerCase() === "manager" && user.manager && (
  <>
    <h3 style={{ marginTop: 24 }}>Thông tin quản lý</h3>

    <div className="row">
      <div className="label">Tòa nhà</div>
      <div className="value">{user.manager.building}</div>
    </div>

    <div className="row">
      <div className="label">Ghi chú</div>
      <div className="value">{user.manager.note}</div>
    </div>
  </>
)}

        <div className="actions">
          <button
            className="btn btn-gray"
            onClick={() => navigate("/users")}
          >
            Quay lại
          </button>
          {isManager && (
    <button
      className="btn btn-primary"
      onClick={() => navigate(`/users/${user.id}/edit`)}
    >
      Sửa thông tin
    </button>
  )}
        </div>
      </div>
    </div></div>
  );
}
