import React, { useMemo, useState } from "react";
import { colors } from "../../constants/colors";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/api/auth";

export default function NewPasswordPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const ctx = useMemo(() => {
    return state?.userId && state?.resetToken
      ? { userId: state.userId, resetToken: state.resetToken }
      : JSON.parse(sessionStorage.getItem("sami:resetCtx") || "{}");
  }, [state]);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  const handleSubmit = async () => {
    if (pw1.length < 8) return alert("Mật khẩu tối thiểu 8 ký tự");
    if (pw1 !== pw2) return alert("Mật khẩu nhập lại không khớp");
    if (!ctx?.userId || !ctx?.resetToken)
      return alert("Thiếu thông tin xác thực đặt lại mật khẩu");

    try {
      const res = await resetPassword({
        userId: ctx.userId,
        resetToken: ctx.resetToken,
        newPassword: pw1,
      });
      alert(res?.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
      sessionStorage.removeItem("sami:resetCtx");
      navigate("/login");
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Đặt lại mật khẩu thất bại"
      );
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.brand,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          width: 400,
          padding: 30,
          borderRadius: 12,
          boxShadow: "0 3px 6px rgba(0,0,0,.15)",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
          Đặt mật khẩu mới
        </h2>
        <input
          type="password"
          placeholder="Mật khẩu mới (≥ 8 ký tự)"
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <input
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 16,
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            backgroundColor: colors.brand,
            color: "#fff",
            padding: 12,
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Xác nhận
        </button>
      </div>
    </div>
  );
}
