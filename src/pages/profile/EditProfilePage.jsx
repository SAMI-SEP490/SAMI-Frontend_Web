import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Headers from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { Form, Button, Alert, Image } from "react-bootstrap";
import { getProfile, updateProfile } from "../../services/api/auth";

const toInputDate = (v) => {
  if (!v) return "";
  const s = String(v);
  const base = s.includes("T") ? s.split("T")[0] : s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(base)) return base;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const toUiGender = (g) =>
  g === "Male" ? "Nam" : g === "Female" ? "Nữ" : g ? "Khác" : "Nam";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: "",
    full_name: "",
    birthday: "",
    gender: "Nam", // UI: Nam|Nữ|Khác
    email: "",
    phone: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("danger");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const p = await getProfile();
        setForm({
          id: p.id || "",
          full_name: p.full_name || "",
          birthday: toInputDate(p.birthday),
          gender: toUiGender(p.gender),
          email: p.email || "",
          phone: p.phone || "",
          avatar_url: p.avatar_url || "",
        });
      } catch (e) {
        setMessage(e?.response?.data?.message || "Không tải được hồ sơ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSave = async () => {
    if (!form.full_name || !form.email || !form.phone) {
      setVariant("danger");
      setMessage("Vui lòng nhập đủ tên, email, SĐT.");
      return;
    }
    try {
      setSaving(true);
      setMessage("");
      await updateProfile(form); // form.gender sẽ được map -> 'Male|Female|Other' ở service
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
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{ marginBottom: 10, position: "sticky", top: 0, zIndex: 1000 }}
      >
        <Headers />
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "auto" }}>
        <div
          style={{
            width: 220,
            backgroundColor: colors.brand,
            color: "#fff",
            borderRadius: 10,
          }}
        >
          <Sidebar />
        </div>

        <div
          style={{
            flex: 1,
            background: colors.background,
            display: "flex",
            justifyContent: "center",
            padding: "40px 20px",
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

            {message && <Alert variant={variant}>{message}</Alert>}

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  overflow: "hidden",
                }}
              >
                {form.avatar_url ? (
                  <Image
                    src={form.avatar_url}
                    roundedCircle
                    style={{ width: 120, height: 120, objectFit: "cover" }}
                  />
                ) : null}
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

            <Section title="Thông tin cơ bản">
              <Form.Group className="mb-3">
                <Form.Label>Tên</Form.Label>
                <Form.Control
                  value={form.full_name}
                  onChange={onChange("full_name")}
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
                <Gender
                  value={form.gender}
                  onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                />
              </Form.Group>
            </Section>

            <div style={{ height: 20 }} />

            <Section title="Thông tin liên hệ">
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
                justifyContent: "center",
                gap: 20,
                marginTop: 25,
              }}
            >
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/profile")}
              >
                Quay lại
              </Button>
              <Button variant="primary" onClick={onSave} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
          border: "1px solid #E5E7EB",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          padding: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Gender({ value, onChange }) {
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
