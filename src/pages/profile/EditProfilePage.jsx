import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { Form, Button, Alert, Image } from "react-bootstrap";
import { getProfile, updateProfile } from "../../services/api/auth";

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
          padding: 20,
          backgroundColor: "#fff",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          border: `1px solid ${colors.border}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function GenderToggle({ value, onChange }) {
  const options = ["Nam", "Nữ", "Khác"];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map((g) => (
        <Button
          key={g}
          variant={value === g ? "primary" : "outline-secondary"}
          size="sm"
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

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    avatar_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("success");

  // Load hồ sơ lúc mở trang
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const profile = await getProfile(); // đã normalize trong auth.js

        if (!mounted) return;

        setForm((prev) => ({
          ...prev,
          full_name: profile.full_name ?? "",
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          birthday: toInputDate(profile.birthday),
          gender: toUiGender(profile.gender),
          avatar_url: profile.avatar_url ?? "",
        }));
      } catch (e) {
        if (!mounted) return;
        setVariant("danger");
        setMessage(
          e?.response?.data?.message ||
            e?.message ||
            "Không tải được thông tin hồ sơ."
        );
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

  const handleChangeAvatar = () => {
    const url = window.prompt("Nhập URL ảnh đại diện mới:", form.avatar_url);
    if (url !== null) {
      setForm((prev) => ({ ...prev, avatar_url: url.trim() }));
    }
  };

  const onSave = async () => {
    const fullName = (form.full_name || "").trim();
    const email = (form.email || "").trim();
    const phone = (form.phone || "").trim();

    if (!fullName || !email || !phone) {
      setVariant("danger");
      setMessage("Vui lòng nhập đầy đủ tên, email và số điện thoại.");
      return;
    }

    // ✅ EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setVariant("danger");
      setMessage("Email không đúng định dạng.");
      return;
    }

    // ✅ SĐT: 10–11 số, bắt đầu bằng 0
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(phone)) {
      setVariant("danger");
      setMessage("Số điện thoại phải có ít nhất 10 chữ số và bắt đầu bằng 0.");
      return;
    }

    // ✅ NGÀY SINH: trước hiện tại, >= 18 tuổi, <= 100 tuổi
    if (form.birthday) {
      const birth = new Date(form.birthday);
      if (Number.isNaN(birth.getTime())) {
        setVariant("danger");
        setMessage("Ngày sinh không hợp lệ.");
        return;
      }

      const today = new Date();
      if (birth > today) {
        setVariant("danger");
        setMessage("Ngày sinh phải trước thời gian hiện tại.");
        return;
      }

      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
      if (birth < hundredYearsAgo) {
        setVariant("danger");
        setMessage("Ngày sinh không hợp lệ.");
        return;
      }

      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      if (birth > eighteenYearsAgo) {
        setVariant("danger");
        setMessage("Bạn phải ít nhất 18 tuổi.");
        return;
      }
    }

    try {
      setSaving(true);
      setMessage("");

      // updateProfile trong auth.js đã tự map gender, birthday, avatar_url
      await updateProfile({
        ...form,
        full_name: fullName,
        email,
        phone,
      });

      setVariant("success");
      setMessage("Cập nhật hồ sơ thành công!");

      // Điều hướng về trang profile sau khi lưu
      setTimeout(() => {
        navigate("/profile");
      }, 800);
    } catch (e) {
      setVariant("danger");
      setMessage(
        e?.response?.data?.message || e?.message || "Cập nhật hồ sơ thất bại!"
      );
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
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2 style={{ marginBottom: 20 }}>Chỉnh sửa hồ sơ</h2>

      <div
        style={{
          width: "70%",
          maxWidth: 900,
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
        }}
      >
        {message && (
          <Alert
            variant={variant}
            onClose={() => setMessage("")}
            dismissible
            className="mb-3"
          >
            {message}
          </Alert>
        )}

        {/* Avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Image
            src={
              form.avatar_url ||
              "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" +
                encodeURIComponent(form.full_name || "User")
            }
            roundedCircle
            style={{ width: 96, height: 96, objectFit: "cover" }}
            alt="Avatar"
          />
          <div>
            <div style={{ fontWeight: 600 }}>{form.full_name || "—"}</div>
            <div style={{ fontSize: 14, color: colors.muted }}>
              {form.email || "—"}
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              className="mt-2"
              onClick={handleChangeAvatar}
            >
              <i className="bi bi-camera"></i> Đổi ảnh
            </Button>
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <Section title="Thông tin cơ bản">
          <Form.Group className="mb-3">
            <Form.Label>Tên</Form.Label>
            <Form.Control
              value={form.full_name}
              onChange={onChange("full_name")}
              placeholder="Nhập họ và tên"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ngày sinh</Form.Label>
            <Form.Control
              type="date"
              value={form.birthday}
              onChange={onChange("birthday")}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Giới tính</Form.Label>
            <div>
              <GenderToggle
                value={form.gender}
                onChange={(g) => setForm((prev) => ({ ...prev, gender: g }))}
              />
            </div>
          </Form.Group>
        </Section>

        {/* Liên hệ */}
        <Section title="Liên hệ">
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={form.email}
              onChange={onChange("email")}
              placeholder="Nhập email"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control
              value={form.phone}
              onChange={onChange("phone")}
              placeholder="Nhập số điện thoại"
            />
          </Form.Group>
        </Section>

        {/* Nút hành động */}
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
