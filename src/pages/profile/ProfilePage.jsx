import React, { useEffect, useState } from "react";
import { colors } from "../../constants/colors";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../services/api/auth";

// Format DD/MM/YYYY (không kèm giờ)
function formatDateOnly(v) {
  if (!v) return "—";
  const s = String(v);
  const base = s.includes("T") ? s.split("T")[0] : s;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(base)) {
    const [yyyy, mm, dd] = base.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }
  return s;
}

// === VIETNAMIZE helpers ===
const GENDER_VI = { male: "Nam", female: "Nữ", other: "Khác" };
function viGender(g) {
  if (!g) return "—";
  const key = String(g).toLowerCase();
  return GENDER_VI[key] || g;
}

const ROLE_VI = { owner: "Chủ trọ", manager: "Quản lý", tenant: "Người thuê" };
function viRole(r) {
  if (!r) return "—";
  const key = String(r).toLowerCase();
  return ROLE_VI[key] || r;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile(); // /auth/profile
        setProfile(data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Không tải được hồ sơ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-3">Đang tải...</div>;
  if (!profile || err)
    return (
      <div className="p-3">
        <p>Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.</p>
      </div>
    );

  const { avatar_url, full_name, birthday, gender, role, email, phone } =
    profile;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        backgroundColor: colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "#fff",
          border: "1px solid #E5E7EB",
          marginBottom: 30,
          overflow: "hidden",
        }}
      >
        {avatar_url ? (
          <img
            src={avatar_url}
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </div>

      {/* Card: Thông tin cơ bản */}
      <div
        style={{
          width: "60%",
          backgroundColor: "#fff",
          borderRadius: 10,
          marginBottom: 20,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: colors.brand,
            color: "#fff",
            padding: "10px 20px",
            fontWeight: "bold",
          }}
        >
          Thông tin cơ bản
        </div>
        <div style={{ padding: 20 }}>
          <p>
            <strong>Tên:</strong> {full_name || "—"}
          </p>
          <p>
            <strong>Ngày sinh:</strong> {formatDateOnly(birthday)}
          </p>
          <p>
            <strong>Giới tính:</strong> {viGender(gender)}
          </p>
          <p>
            <strong>Vai trò:</strong> {viRole(role)}
          </p>
        </div>
      </div>

      {/* Card: Thông tin liên hệ */}
      <div
        style={{
          width: "60%",
          backgroundColor: "#fff",
          borderRadius: 10,
          marginBottom: 30,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: colors.brand,
            color: "#fff",
            padding: "10px 20px",
            fontWeight: "bold",
          }}
        >
          Thông tin liên hệ
        </div>
        <div style={{ padding: 20 }}>
          <p>
            <strong>Email:</strong> {email || "—"}
          </p>
          <p>
            <strong>SĐT:</strong> {phone || "—"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <Button
          type="button"
          onClick={() => navigate("/change-password")}
          variant="outline-primary"
        >
          Thay đổi mật khẩu
        </Button>
        <Button
          type="button"
          onClick={() => navigate("/edit-profile")}
          variant="primary"
        >
          Sửa
        </Button>
        <Button onClick={() => navigate(-1)} variant="outline-secondary">
          Quay lại
        </Button>
      </div>
    </div>
  );
}
