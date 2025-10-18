import React, { useContext, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import SideBar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { UserContext } from "../../contexts/UserContext";

export default function TenantEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, setUserData } = useContext(UserContext); // setUserData có trong context để cập nhật mock

  const origin = useMemo(
    () => userData.find((u) => String(u.id) === String(id)),
    [userData, id]
  );

  const [form, setForm] = useState({
    id: origin?.id ?? "",
    full_name: origin?.full_name ?? "",
    phone: origin?.phone ?? "",
    email: origin?.email ?? "",
    birthday: origin?.birthday ?? "1/1/2000",
    gender: origin?.gender ?? "Nam", // "Nam" | "Nữ" | "Khác"
    avatar_url: origin?.avatar_url ?? "",
    avatar_preview: origin?.avatar_url ?? "",
  });

  const onChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, avatar_preview: url, avatar_file: file }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // cập nhật mock vào UserContext (chưa có backend)
    const next = userData.map((u) =>
      String(u.id) === String(form.id)
        ? {
            ...u,
            full_name: form.full_name,
            phone: form.phone,
            email: form.email,
            birthday: form.birthday,
            gender: form.gender,
            avatar_url: form.avatar_preview || u.avatar_url,
          }
        : u
    );
    setUserData(next);
    alert("Cập nhật thành công (mock)");
    navigate(`/tenants/${form.id}`); // quay về trang detail
  };

  if (!origin) {
    return (
      <div style={{ padding: 24 }}>Không tìm thấy người thuê (ID: {id})</div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header GIỮ NGUYÊN */}
      <Header />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div
          style={{
            width: 220,
            background: colors.brand,
            color: "#fff",
            borderRadius: 10,
          }}
        >
          <SideBar />
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            background: colors.background,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "28px 16px 56px",
            overflowY: "auto",
          }}
        >
          {/* Avatar zone */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 18,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 14,
                border: "1.5px dashed #CBD5E1",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                margin: "0 auto",
              }}
            >
              {form.avatar_preview ? (
                <img
                  src={form.avatar_preview}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ color: "#94A3B8" }}>Ảnh</span>
              )}
            </div>

            {/* nút + */}
            <label
              htmlFor="avatarInput"
              style={{
                position: "absolute",
                right: -10,
                bottom: -10,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: colors.brand,
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                cursor: "pointer",
                boxShadow: "0 6px 14px rgba(0,0,0,.15)",
              }}
              title="Tải ảnh"
            >
              +
            </label>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              onChange={onPickAvatar}
              hidden
            />

            <div style={{ marginTop: 8, color: "#64748B" }}>Ảnh Đại Diện</div>
          </div>

          {/* Form card */}
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
              Thông tin người thuê
            </div>

            <div style={{ padding: 20 }}>
              <Field label="ID">
                <input value={form.id} disabled style={input} />
              </Field>

              <Field label="Tên người thuê">
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
          </form>

          {/* Action buttons */}
          <div
            style={{
              width: 760,
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: "transparent",
                border: "none",
                color: "#0F172A",
                fontWeight: 700,
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              Quay lại
            </button>

            <button
              onClick={onSubmit}
              style={{
                background: colors.brand,
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
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
