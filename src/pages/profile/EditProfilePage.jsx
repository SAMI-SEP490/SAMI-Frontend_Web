import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { Form, Button, Alert, Image } from "react-bootstrap";
import { getProfile } from "../../services/api/auth";
import { updateProfile } from "../../services/api/users";

// Chuẩn hóa date string về dạng YYYY-MM-DD cho input[type="date"]
const toInputDate = (v) => {
  if (!v) return "";
  const s = String(v);
  const base = s.includes("T") ? s.split("T")[0] : s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(base)) return base;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

// Map giới tính từ BE sang UI
const toUiGender = (g) => {
  if (!g) return "";
  const v = String(g).toLowerCase();
  if (v === "male" || v === "nam") return "Nam";
  if (v === "female" || v === "nữ" || v === "nu") return "Nữ";
  return "Khác";
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          background: colors.brand,
          color: "#fff",
          padding: "8px 12px",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      <div
        style={{
          border: "1px solid #ddd",
          borderTop: "none",
          padding: 16,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function GenderSelector({ value, onChange }) {
  const items = ["Nam", "Nữ", "Khác"];
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {items.map((g) => (
        <Button
          key={g}
          variant={value === g ? "primary" : "outline-secondary"}
          style={{ borderRadius: 20, padding: "5px 15px" }}
          onClick={() => onChange(g)}
        >
          {g}
        </Button>
      ))}
    </div>
  );
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    avatar_url: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("success");

  // Load profile
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getProfile();
        const u = res?.user || res?.data?.user || res?.data || res || {};

        if (!mounted) return;

        setForm({
          full_name: u.full_name ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          birthday: toInputDate(u.birthday ?? u.dob),
          gender: toUiGender(u.gender ?? u.sex),
          avatar_url: u.avatar_url ?? u.avatarUrl ?? "",
        });
      } catch {
        setVariant("danger");
        setMessage("Không tải được thông tin hồ sơ.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onChange = (field) => (eOrValue) => {
    const value =
      eOrValue && eOrValue.target ? eOrValue.target.value : eOrValue;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ chọn ảnh
  const onSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setVariant("danger");
      setMessage("Vui lòng chọn file ảnh.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSave = async () => {
    const fullName = (form.full_name || "").trim();
    const email = (form.email || "").trim();
    const phone = (form.phone || "").trim();

    if (!fullName || !email || !phone) {
      setVariant("danger");
      setMessage("Vui lòng nhập đủ tên, email, SĐT.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      // ✅ GỬI avatar + data cùng lúc (multipart/form-data)
      await updateProfile({
        full_name: fullName,
        email,
        phone,
        birthday: form.birthday,
        gender: form.gender,
        avatar: avatarFile, // 👈 QUAN TRỌNG
      });

      console.log({
        full_name: fullName,
        email,
        phone,
        birthday: form.birthday,
        gender: form.gender,
        avatar: avatarFile,
      });
      setVariant("success");
      setMessage("Cập nhật hồ sơ thành công!");
      setTimeout(() => navigate("/profile"), 800);
    } catch (e) {
      setVariant("danger");
      setMessage(e?.response?.data?.message || "Cập nhật hồ sơ thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-3">Đang tải...</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: colors.background,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "60%",
          background: "#fff",
          borderRadius: 10,
          padding: 30,
          boxShadow: "0 2px 6px rgba(0,0,0,.1)",
        }}
      >
        <h4 style={{ textAlign: "center", color: colors.brand }}>
          Chỉnh sửa hồ sơ
        </h4>

        {message && (
          <Alert
            variant={variant}
            className="mt-3"
            onClose={() => setMessage("")}
            dismissible
          >
            {message}
          </Alert>
        )}

        {/* ===== AVATAR ===== */}
        <Section title="Ảnh đại diện">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Image
              src={
                avatarPreview ||
                form.avatar_url ||
                "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" +
                  encodeURIComponent(form.full_name || "User")
              }
              roundedCircle
              width={72}
              height={72}
            />

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{form.full_name}</div>
              <div style={{ color: "#666", fontSize: 13 }}>{form.email}</div>
            </div>

            <Button
              variant="outline-primary"
              onClick={() => fileRef.current.click()}
            >
              <i className="bi bi-camera" /> Đổi ảnh
            </Button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onSelectAvatar}
            />
          </div>
        </Section>

        <Section title="Thông tin cơ bản">
          <Form.Group className="mb-3">
            <Form.Label>Tên</Form.Label>
            <Form.Control
              value={form.full_name}
              onChange={onChange("full_name")}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Giới tính</Form.Label>
            <GenderSelector
              value={form.gender}
              onChange={(v) => setForm((prev) => ({ ...prev, gender: v }))}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Ngày sinh</Form.Label>
            <Form.Control
              type="date"
              value={form.birthday || ""}
              onChange={onChange("birthday")}
            />
          </Form.Group>
        </Section>

        <Section title="Liên hệ">
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control value={form.email} disabled />
          </Form.Group>

          <Form.Group>
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control value={form.phone} onChange={onChange("phone")} />
          </Form.Group>
        </Section>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => navigate("/profile")}
          >
            Hủy
          </Button>
          <Button variant="primary" disabled={saving} onClick={onSave}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
