import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { colors } from "../../constants/colors";
import { getUserById, updateUser } from "../../services/api/users";

// helper: convert mọi dạng về 'YYYY-MM-DD' cho input[type=date]
function toInputDate(v) {
  if (!v) return "";
  const s = String(v);
  const base = s.includes("T") ? s.split("T")[0] : s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(base)) return base;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return "";
}

export default function TenantEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState({
    id: "",
    full_name: "",
    phone: "",
    email: "",
    birthday: "",
    gender: "Nam",
    avatar_url: "",
    avatar_preview: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const u = await getUserById(id);
        if (!mounted) return;
        setForm({
          id: u?.user_id ?? u?.id ?? id,
          full_name: u?.full_name ?? u?.fullName ?? "",
          phone: u?.phone ?? "",
          email: u?.email ?? "",
          birthday: toInputDate(u?.birthday),
          gender: u?.gender ?? "Nam",
          avatar_url: u?.avatar_url ?? "",
          avatar_preview: u?.avatar_url ?? "",
        });
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

  const onChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setErr(null);
      await updateUser(form.id, {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        birthday: form.birthday,
        gender: form.gender,
      });
      alert("Cập nhật thành công");
      navigate(`/tenants/${form.id}`);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        background: colors.background,
        padding: "36px 20px 56px",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: 760,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 6px 16px rgba(0,0,0,.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: colors.brand,
            color: "#fff",
            padding: "10px 16px",
            fontWeight: 700,
          }}
        >
          Thông tin người dùng
        </div>

        <div style={{ padding: 20 }}>
          <Field label="ID">
            <input value={form.id} disabled style={input} />
          </Field>

          <Field label="Tên người dùng">
            <input
              value={form.full_name}
              onChange={onChange("full_name")}
              style={input}
            />
          </Field>

          <Field label="SDT">
            <input
              value={form.phone}
              onChange={onChange("phone")}
              style={input}
            />
          </Field>

          <Field label="Email">
            <input
              value={form.email}
              onChange={onChange("email")}
              style={input}
            />
          </Field>

          <Field label="Ngày sinh">
            <input
              type="date"
              value={form.birthday}
              onChange={onChange("birthday")}
              style={input}
            />
          </Field>

          <Field label="Giới tính">
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              {["Nam", "Nữ", "Khác"].map((g) => (
                <label
                  key={g}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={onChange("gender")}
                  />
                  {g}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: 16,
          }}
        >
          <button type="button" onClick={() => navigate(-1)} style={btnGhost}>
            Quay lại
          </button>
          <button type="submit" disabled={saving} style={btnPrimary}>
            {saving ? "Đang lưu..." : "Xác nhận"}
          </button>
        </div>
      </form>

      {err && (
        <div
          style={{
            width: 760,
            marginTop: 12,
            border: "1px solid #fecaca",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: 10,
            padding: 12,
          }}
        >
          {String(err)}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        alignItems: "center",
        marginBottom: 14,
      }}
    >
      <div style={{ color: "#334155" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

const input = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  background: "#F1F5F9",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
};

const btnPrimary = {
  background: colors.brand,
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer",
};

const btnGhost = {
  background: "transparent",
  border: "none",
  color: "#0F172A",
  fontWeight: 700,
  padding: "10px 12px",
  cursor: "pointer",
};
