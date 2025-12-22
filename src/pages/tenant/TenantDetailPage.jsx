// src/pages/tenant/TenantDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { getUserById } from "../../services/api/users";
import { deleteTenantByUserId } from "../../services/api/tenants";

// Helper: format DD/MM/YYYY (không có giờ)
function formatDateOnly(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return v;
}

export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchUser() {
      try {
        setLoading(true);
        setError("");
        const data = await getUserById(id);
        if (cancelled) return;
        setUser(data || null);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Không lấy được thông tin người thuê.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) fetchUser();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = () => navigate("/tenants");

  const handleEdit = () => {
    navigate(`/tenants/${id}/edit`);
  };

  const handleDelete = async () => {
    const ok = window.confirm(
      `Bạn có chắc chắn muốn xóa người thuê "${
        user?.full_name || user?.fullName || user?.name || ""
      }"?`
    );
    if (!ok) return;

    try {
      await deleteTenantByUserId(id);
      alert("Xóa người thuê thành công.");
      navigate("/tenants");
    } catch (e) {
      alert(e?.message || "Xóa người thuê thất bại.");
    }
  };

  const fullName = user?.full_name || user?.fullName || user?.name || "—";
  const email = user?.email || "—";
  const phone = user?.phone || user?.phone_number || "—";
  const gender =
    user?.gender === "male" || user?.gender === 1
      ? "Nam"
      : user?.gender === "female" || user?.gender === 2
      ? "Nữ"
      : "Khác";
  const birthday = formatDateOnly(user?.birthday || user?.date_of_birth);

  const roomName =
    user?.room?.room_number ||
    user?.room?.name ||
    user?.room_number ||
    user?.roomName ||
    "—";

  return (
    <div className="page-container">
      <div className="page-header d-flex justify-content-between align-items-center mb-3">
        <h2 className="page-title mb-0">Chi tiết người thuê</h2>
        <button className="btn btn-secondary" onClick={handleBack}>
          Quay lại
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {loading && <div>Đang tải thông tin người thuê...</div>}
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          {!loading && !error && !user && <div>Không tìm thấy người thuê.</div>}

          {!loading && user && (
            <>
              <div className="row mb-3">
                <div className="col-md-8">
                  <h3 className="mb-3">{fullName}</h3>
                  <div className="mb-2">
                    <strong>ID:</strong> {user.id}
                  </div>
                  <div className="mb-2">
                    <strong>Email:</strong> {email}
                  </div>
                  <div className="mb-2">
                    <strong>Số điện thoại:</strong> {phone}
                  </div>
                  <div className="mb-2">
                    <strong>Giới tính:</strong> {gender}
                  </div>
                  <div className="mb-2">
                    <strong>Ngày sinh:</strong> {birthday}
                  </div>
                  <div className="mb-2">
                    <strong>Phòng:</strong> {roomName}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  onClick={handleDelete}
                  style={{
                    height: 42,
                    padding: "0 24px",
                    borderRadius: 8,
                    border: "none",
                    background: "#DC2626",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  Xóa
                </button>
                <button
                  onClick={handleEdit}
                  style={{
                    height: 42,
                    padding: "0 24px",
                    borderRadius: 8,
                    border: "none",
                    background: colors.brand,
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  Sửa
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
