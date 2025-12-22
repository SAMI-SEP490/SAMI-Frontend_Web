import React, { useMemo, useState } from "react";
import { colors } from "../../constants/colors";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyResetOTP, resendResetOTP } from "../../services/api/auth";

function useResetContext() {
  const location = useLocation();
  return useMemo(() => {
    const { state, search } = location;
    const s = new URLSearchParams(search);
    const email = state?.email || s.get("email") || "";

    let userId = state?.userId;
    if (!userId) {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("sami:resetCtx") || "{}"
        );
        if (saved.userId) userId = saved.userId;
      } catch (e) {
        console.warn("Không đọc được resetCtx từ sessionStorage:", e);
      }
    }

    return { email, userId };
  }, [location]);
}

export default function VerifyResetOtpPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { email, userId } = useResetContext();

  const handleVerify = async () => {
    if (!code.trim()) return alert("Vui lòng nhập mã xác thực");
    if (!/^\d{6}$/.test(code)) return alert("Mã xác thực phải gồm 6 chữ số");

    if (!userId) {
      alert("Thiếu thông tin phiên đặt lại mật khẩu. Vui lòng nhập email lại.");
      navigate("/forgot-password", { replace: true });
      return;
    }

    try {
      setLoading(true);
      // BE verify theo userId + otp
      const res = await verifyResetOTP({ userId, otp: code.trim() });

      const { userId: uid, resetToken, message } = res || {};
      if (!uid || !resetToken) {
        throw new Error("Thiếu userId/resetToken từ server");
      }

      // Lưu lại để trang đổi mật khẩu dùng
      try {
        sessionStorage.setItem(
          "sami:resetCtx",
          JSON.stringify({ userId: uid, resetToken, email })
        );
      } catch (e) {
        console.warn("Không lưu được resetCtx sau verify:", e);
      }

      alert(message || "Xác nhận OTP thành công!");
      navigate("/new-password", { state: { userId: uid, resetToken } });
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Xác thực mã thất bại";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId) {
      alert("Thiếu thông tin phiên đặt lại mật khẩu. Vui lòng nhập email lại.");
      navigate("/forgot-password", { replace: true });
      return;
    }

    try {
      const res = await resendResetOTP({ userId });
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
            marginBottom: 20,
          }}
        />

        <button
          onClick={handleVerify}
          disabled={loading}
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
            opacity: loading ? 0.8 : 1,
            marginBottom: 10,
          }}
        >
          {loading ? "Đang xác minh..." : "Xác nhận"}
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
