import React, { useState } from "react";
import { colors } from "../../constants/colors";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/api/auth";
import { listTenants } from "../../services/api/users"; // lấy data tenant từ BE

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleNext = async () => {
    const trimmed = email.trim();

    // 1️⃣ Bắt buộc nhập
    if (!trimmed) {
      alert("Vui lòng nhập email khôi phục");
      return;
    }

    // 2️⃣ Validate format email
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(trimmed)) {
      alert("Vui lòng nhập email đúng định dạng.");
      return;
    }

    // 3️⃣ Check xem có phải tenant không
    let isTenant = false;
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

    // 4️⃣ Nếu là tenant → chặn hẳn chức năng
    if (isTenant) {
      alert("Người thuê không có quyền sử dụng chức năng này!");
      return;
    }

    // 5️⃣ Gọi API quên mật khẩu cho các role khác (owner/manager/...)
    try {
      const res = await forgotPassword(trimmed);

      // Backend ALWAYS trả success:true, nên phải đọc message
      const rawMsg = String(res?.message || "").toLowerCase();

      // ❌ Email không tồn tại trong hệ thống
      if (rawMsg.includes("does not exist")) {
        alert("Email không tồn tại trong hệ thống");
        // Không điều hướng, cho user nhập lại email
        return;
      }

      // ✅ Case bình thường: gửi OTP thành công
      alert(res?.message || "Đã gửi mã xác thực tới email của bạn.");
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
