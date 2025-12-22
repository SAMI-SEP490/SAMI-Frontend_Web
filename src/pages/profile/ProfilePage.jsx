import React, { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { getProfile } from "../../services/api/auth";

/* ================== Helpers ================== */

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

// Vietnamize
const GENDER_VI = { male: "Nam", female: "Nữ", other: "Khác" };
const ROLE_VI = { owner: "Chủ trọ", manager: "Quản lý", tenant: "Người thuê" };

const viGender = (g) => (g ? GENDER_VI[String(g).toLowerCase()] || g : "—");

const viRole = (r) => (r ? ROLE_VI[String(r).toLowerCase()] || r : "—");

/* ================== Component ================== */

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile(); // GET /auth/profile
        setProfile(data);
      } catch (e) {
        setError(e?.response?.data?.message || "Không tải được hồ sơ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="p-4 text-center text-danger">
        Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.
      </div>
    );
  }

  const { avatar_url, full_name, birthday, gender, role, email, phone } =
    profile;

  const avatarSrc =
    avatar_url ||
    `https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=256&name=${encodeURIComponent(
      full_name || "User"
    )}`;

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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        title="Chỉnh sửa hồ sơ"
        onClick={() => navigate("/edit-profile")}
      >
        <img
          src={avatarSrc}
          alt="Avatar"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Thông tin cơ bản */}
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
            fontWeight: 600,
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

      {/* Thông tin liên hệ */}
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
            fontWeight: 600,
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
        }}
      >
        <Button
          variant="outline-primary"
          onClick={() => navigate("/change-password")}
        >
          Thay đổi mật khẩu
        </Button>

        <Button variant="primary" onClick={() => navigate("/edit-profile")}>
          Sửa
        </Button>

        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    </div>
  );
}
