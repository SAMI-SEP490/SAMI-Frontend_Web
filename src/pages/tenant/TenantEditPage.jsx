import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { colors } from "../../constants/colors";
import { getUserById, updateUser, listUsers } from "../../services/api/users";

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
        });
      } catch (e) {
        if (!mounted) return;
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Không lấy được thông tin người dùng"
        );
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
    setErr(null);

    // ===== VALIDATE FRONTEND =====

    // 1. Đầy đủ thông tin
    if (
      !form.full_name ||
      !form.phone ||
      !form.email ||
      !form.birthday ||
      !form.gender
    ) {
      setErr("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    // 2. Ngày sinh phải trước hiện tại
    const dob = new Date(form.birthday);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dob.setHours(0, 0, 0, 0);

    if (isNaN(dob.getTime()) || dob > today) {
      setErr("Ngày sinh phải trước hiện tại");
      return;
    }

    // 3. Số điện thoại >= 10 chữ số
    const phoneDigits = String(form.phone).replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setErr("Số điện thoại phải có ít nhất 10 chữ số.");
      return;
    }

    // 4. Email đúng định dạng
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailTrimmed = form.email.trim();
    if (!emailRegex.test(emailTrimmed)) {
      setErr("Email không đúng định dạng.");
      return;
    }

    // 5. ✅ Email đã tồn tại trong hệ thống (trừ chính tenant đang sửa)
    try {
      const users = await listUsers(); // lấy toàn bộ user trong hệ thống
      const currentId = String(form.id);
      const normalizedEmail = emailTrimmed.toLowerCase();

      const duplicated = users.some((u) => {
        const uid =
          u?.user_id ??
          u?.id ??
          u?.uid ??
          u?._id ??
          u?.data?.id ??
          u?.data?.user_id;
        const email = (u?.email || "").toLowerCase();
        // trùng email + KHÁC userId hiện tại
        return email && email === normalizedEmail && String(uid) !== currentId;
      });

      if (duplicated) {
        setErr("Email đã tồn tại.");
        return;
      }
    } catch (listErr) {
      // Nếu listUsers lỗi (network, quyền, v.v.) thì bỏ qua bước check này
      // và để backend validate như cũ
      console.warn("Không kiểm tra được trùng email ở FE:", listErr);
    }

    // ===== GỌI API UPDATE =====
    try {
      setSaving(true);
      await updateUser(form.id, {
        full_name: form.full_name,
        phone: form.phone,
        email: emailTrimmed,
        birthday: form.birthday,
        gender: form.gender,
      });

      alert("Cập nhật thành công");
      navigate(`/tenants/${form.id}`);
    } catch (e) {
      const raw =
        e?.response?.data?.message ||
        e?.message ||
        "Cập nhật thất bại. Vui lòng thử lại.";
      const lower = String(raw).toLowerCase();

      // map lỗi email trùng từ backend
      if (lower.includes("email") && lower.includes("exist")) {
        setErr("Email đã tồn tại.");
      } else {
        setErr(raw);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Đang tải thông tin người dùng...</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: colors.background,
        padding: "36px 20px 56px",
      }}
    >
      {/* CARD CHÍNH */}
      <form
        onSubmit={onSubmit}
        style={{
          width: 760,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 6px 16px rgba(0,0,0,.08)",
          overflow: "hidden",
        }}
      >
        {/* HEADER XANH */}
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

        {/* NỘI DUNG FORM */}
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
            <div style={{ display: "flex", gap: 16 }}>
              {["Nam", "Nữ", "Khác"].map((g) => (
                <label
                  key={g}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <input
                    type="radio"
                    value={g}
                    checked={form.gender === g}
                    onChange={onChange("gender")}
                    style={{ marginRight: 6 }}
                  />
                  {g}
                </label>
              ))}
            </div>
          </Field>
        </div>

        {/* NÚT HÀNH ĐỘNG */}
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

      {/* PANEL LỖI BÊN DƯỚI (MÀU HỒNG GIỐNG HÌNH) */}
      {err && (
        <div
          style={{
            width: 760,
            maxWidth: "100%",
            marginTop: 12,
            border: "1px solid #fecaca",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: 10,
            padding: 12,
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}

// Field wrapper giữ layout label bên trái, input bên phải (CSS như ban đầu)
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

// STYLE INPUT & BUTTONS theo giao diện cũ
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
