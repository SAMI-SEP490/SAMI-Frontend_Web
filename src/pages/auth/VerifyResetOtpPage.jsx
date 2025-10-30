import React, { useMemo, useState } from "react";
import { colors } from "../../constants/colors";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyResetOTP, resendResetOTP } from "../../services/api/auth";

function useEmailFromLocation() {
  const { state, search } = useLocation();
  return useMemo(() => {
    const s = new URLSearchParams(search);
    return state?.email || s.get("email") || "";
  }, [state, search]);
}

export default function VerifyResetOtpPage() {
  const [code, setCode] = useState("");
  const email = useEmailFromLocation();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!code.trim()) return alert("Vui lòng nhập mã xác thực");
    if (!/^\d{6}$/.test(code)) return alert("Mã xác thực phải gồm 6 chữ số");

    try {
      // BE cho phép verify theo email (hoặc userId). Ở đây dùng email.
      const res = await verifyResetOTP({ email, otp: code.trim() });
      // res cần trả { userId, resetToken }
      const { userId, resetToken, message } = res || {};
      if (!userId || !resetToken)
        throw new Error("Thiếu userId/resetToken từ server");
      // để phòng F5 trang tiếp theo
      sessionStorage.setItem(
        "sami:resetCtx",
        JSON.stringify({ userId, resetToken })
      );
      alert(message || "Xác nhận OTP thành công!");
      navigate("/new-password", { state: { userId, resetToken } });
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Xác thực mã thất bại";
      alert(msg);
    }
  };

  const handleResend = async () => {
    try {
      const res = await resendResetOTP({ email });
      alert(res?.message || "Đã gửi lại mã");
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Không gửi lại được mã"
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
          Xác minh mã
        </h2>
        <p style={{ color: "#555", fontSize: 14, marginBottom: 16 }}>
          Mã xác thực đã được gửi tới: <b>{email || "(chưa có email)"}</b>
        </p>

        <input
          type="text"
          placeholder="Nhập mã 6 ký tự"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid #ccc",
            textAlign: "center",
            letterSpacing: 8,
            marginBottom: 16,
          }}
        />

        <button
          onClick={handleVerify}
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
            marginBottom: 10,
          }}
        >
          Xác nhận
        </button>

        <button
          onClick={handleResend}
          style={{
            width: "100%",
            backgroundColor: "#f0f0f0",
            color: colors.brand,
            padding: 12,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Gửi lại mã
        </button>
      </div>
    </div>
  );
}
