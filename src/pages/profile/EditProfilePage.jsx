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

  // Load profile lúc mở trang
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getProfile();
        const u = res?.user || res?.data?.user || res?.data || res || {};

        if (!mounted) return;

        setForm((prev) => ({
          ...prev,
          ...u,
          full_name: u.full_name ?? u.fullName ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          birthday: toInputDate(u.birthday ?? u.dob),
          gender: toUiGender(u.gender ?? u.sex),
          avatar_url: u.avatar_url ?? u.avatarUrl ?? "",
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

  const onSave = async () => {
    const fullName = (form.full_name || "").trim();
    const email = (form.email || "").trim();
    const phone = (form.phone || "").trim();

    if (!fullName || !email || !phone) {
      setVariant("danger");
      setMessage("Vui lòng nhập đủ tên, email, SĐT.");
      return;
    }

    // ✅ EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setVariant("danger");
      setMessage("Email không hợp lệ.");
      return;
    }

    // ✅ SĐT: 10–11 số, bắt đầu bằng 0
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(phone)) {
      setVariant("danger");
      setMessage("SĐT không hợp lệ.");
      return;
    }

    // ✅ NGÀY SINH: 18–100 tuổi
    if (form.birthday) {
      const birth = new Date(form.birthday);
      if (Number.isNaN(birth.getTime())) {
        setVariant("danger");
        setMessage("Ngày sinh không hợp lệ.");
        return;
      }

      const today = new Date();

      // sinh trong tương lai
      if (birth > today) {
        setVariant("danger");
        setMessage("Ngày sinh không hợp lệ.");
        return;
      }

      // > 100 tuổi
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
      if (birth < hundredYearsAgo) {
        setVariant("danger");
        setMessage("Ngày sinh không hợp lệ.");
        return;
      }

      // < 18 tuổi
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
      setTimeout(() => navigate("/profile"), 800);
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

        <Section title="Ảnh đại diện">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Image
              src={
                form.avatar_url ||
                "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" +
                  encodeURIComponent(form.full_name || "User")
              }
              roundedCircle
              width={72}
              height={72}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{form.full_name}</div>
              <div style={{ color: "#666", fontSize: 13 }}>{form.email}</div>
            </div>
            <div>
              <Button
                variant="link"
                onClick={() => alert("Upload avatar sẽ thêm sau.")}
              >
                <i className="bi bi-camera"></i> Đổi ảnh
              </Button>
            </div>
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

          <Form.Group className="mb-3">
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
            <Form.Control
              type="email"
              value={form.email}
              onChange={onChange("email")}
            />
          </Form.Group>
          <Form.Group className="mb-3">
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
