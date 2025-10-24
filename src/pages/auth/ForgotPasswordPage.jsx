// giữ nguyên import React, useState, colors, useNavigate...
import React, { useState } from "react";
import { colors } from "../../constants/colors";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/api/auth"; // GỌI API THẬT

export default function ResetPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const navigate = useNavigate();

  const handleNext = async () => {
    // === GIỮ NGUYÊN VALIDATE EMAIL NHƯ BẢN GỐC ===
    if (!identifier.trim()) {
      alert("Vui lòng nhập email khôi phục");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier.trim())) {
      alert("Vui lòng nhập đúng định dạng email hợp lệ");
      return;
    }
    // ============================================

    try {
      const res = await forgotPassword(identifier.trim());
      alert(res?.message || "Đã gửi mã xác thực tới email của bạn.");

      // LƯU Ý: controller forgotPassword chỉ trả {message, email}; KHÔNG trả userId.
      // Vì verify bước sau cần userId, ta chuyển sang trang VERIFY-RESET-OTP và
      // mang theo email, còn userId sẽ do người dùng nhập (nếu email không kèm userId).
      navigate("/verify-reset-otp", { state: { email: identifier.trim() } });
    } catch (e) {
      const msg =
        e?.response?.data?.message || "Không gửi được mã. Thử lại sau.";
      alert(msg);
    }
  };

  // ======= PHẦN DƯỚI LÀ UI GỐC — GIỮ NGUYÊN =======
  return (
    <div
      style={{
        backgroundColor: colors.brand,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          width: "400px",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>
          Tìm email của bạn
        </h2>
        <p style={{ color: "#555", fontSize: "14px", marginBottom: "20px" }}>
          Nhập email khôi phục
        </p>

        <input
          type="email"
          placeholder="Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            fontSize: "16px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleNext}
          style={{
            width: "100%",
            backgroundColor: colors.brand,
            color: "#fff",
            padding: "12px",
            borderRadius: "6px",
            fontSize: "16px",
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
