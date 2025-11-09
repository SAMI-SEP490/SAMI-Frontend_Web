import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { getUserById } from "../../services/api/users";

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

// Helper: chuyển giới tính sang tiếng Việt
function viGender(g) {
  if (!g) return "—";
  const key = String(g).toLowerCase();
  if (key === "male") return "Nam";
  if (key === "female") return "Nữ";
  if (key === "other") return "Khác";
  return g;
}

const Card = ({ title, children }) => (
  <div
    style={{
      width: "70%",
      backgroundColor: "#fff",
      borderRadius: 10,
      marginBottom: 24,
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        backgroundColor: colors.brand,
        color: "#fff",
        padding: "12px 20px",
        fontWeight: 700,
        fontSize: 16,
      }}
    >
      {title}
    </div>
    <div style={{ padding: 0 }}>{children}</div>
  </div>
);

const Row = ({ label, value, last }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 24,
      padding: "14px 20px",
      borderBottom: last ? "none" : "1px solid #E5E7EB",
      fontSize: 15,
    }}
  >
    <div style={{ width: 220, color: "#64748B" }}>{label}</div>
    <div style={{ flex: 1, color: "#0F172A", fontWeight: 600 }}>
      {value ?? "—"}
    </div>
  </div>
);

export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [user, setUser] = useState(null);

  const goBackToTenantList = () => navigate("/tenants");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await getUserById(id);
        if (!mounted) return;
        setUser(data);
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Load failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const avatar = user?.avatar_url || user?.avatarUrl || "";
  const userId = user?.user_id ?? user?.id ?? id;
  const fullName = user?.full_name ?? user?.fullName;
  const phone = user?.phone;
  const email = user?.email;
  const birthday = user?.birthday;
  const genderVi = viGender(user?.gender);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (err)
    return <div style={{ padding: 24, color: "red" }}>{String(err)}</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: colors.background,
        padding: "36px 20px 56px",
        alignItems: "center",
      }}
    >
      {/* Avatar */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "#fff",
            border: "1px solid #E5E7EB",
            boxShadow: "0 6px 18px rgba(0,0,0,.08)",
            overflow: "hidden",
            margin: "0 auto",
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>
        <div
          style={{
            marginTop: 10,
            display: "inline-block",
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #D1D5DB",
            background: "#fff",
            color: "#374151",
            fontSize: 13,
          }}
        >
          Ảnh Đại Diện
        </div>
      </div>

      <Card title="Thông tin người dùng">
        <Row label="ID" value={userId} />
        <Row label="Tên người dùng" value={fullName} />
        <Row label="SĐT" value={phone} />
        <Row label="Email" value={email} />
        <Row label="Ngày sinh" value={formatDateOnly(birthday)} />
        <Row label="Giới tính" value={genderVi} last />
      </Card>

      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
        <button
          onClick={goBackToTenantList}
          style={{
            height: 42,
            padding: "0 18px",
            borderRadius: 8,
            border: "1px solid #CBD5E1",
            background: "#fff",
            color: "#111827",
            fontWeight: 700,
          }}
        >
          Quay lại
        </button>
        <button
          onClick={() => alert("Xoá (demo)")}
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
          Xoá
        </button>
        <button
          onClick={() => navigate(`/tenants/${userId}/edit`)}
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
    </div>
  );
}
