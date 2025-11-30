import React, { useState } from "react";
import { colors } from "../../constants/colors";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/api/auth";
import { listTenants } from "../../services/api/users"; // ✅ lấy data tenant từ BE

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleNext = async () => {
    const trimmed = email.trim();
    if (!trimmed) return alert("Vui lòng nhập email khôi phục");

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(trimmed)) return alert("Email không hợp lệ");

    let isTenant = false;

    // 1️⃣ Hỏi BE xem email này có phải tenant không
    try {
      const tenants = await listTenants(); // trả về mảng tenant từ BE
      const lower = trimmed.toLowerCase();

      const foundTenant = tenants.find((t) => {
        const tEmail = String(
          t.email || t.user_email || t.userEmail || ""
        ).toLowerCase();
        return tEmail === lower;
      });

      if (foundTenant) {
        isTenant = true;
      }
    } catch (checkErr) {
      console.warn(
        "Không kiểm tra được role tenant, sẽ cho qua flow quên mật khẩu mặc định:",
        checkErr
      );
    }

    // 2️⃣ Nếu là tenant → chặn, không gửi OTP
    if (isTenant) {
      alert("Người thuê không có quyền sử dụng chức năng này!");
      return;
    }

    // 3️⃣ Không phải tenant → cho dùng quên mật khẩu như bình thường
    try {
      const res = await forgotPassword(trimmed);
      alert(res?.message || "Đã gửi mã xác thực tới email của bạn.");
      // chuyển sang trang nhập OTP, mang theo email
      navigate(`/verify-reset-otp?email=${encodeURIComponent(trimmed)}`, {
        state: { email: trimmed },
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Không gửi được mã. Thử lại sau.";
      alert(msg);
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
          Tìm email của bạn
        </h2>
        <p style={{ color: "#555", fontSize: 14, marginBottom: 20 }}>
          Nhập email khôi phục
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 20,
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleNext}
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
          Tiếp theo
        </button>
      </div>
    </div>
  );
}
