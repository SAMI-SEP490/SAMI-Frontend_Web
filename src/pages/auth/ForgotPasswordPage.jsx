import React, { useState, useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import { colors } from "../../constants/colors";
import { useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const { userData, setUserIdChangepassword } = useContext(UserContext);
  const [identifier, setIdentifier] = useState("");
  const navigate = useNavigate();

  const handleNext = () => {
    if (!identifier.trim()) {
      alert("Vui lòng nhập email khôi phục");
      return;
    }

    // Regex kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier.trim())) {
      alert("Vui lòng nhập đúng định dạng email hợp lệ");
      return;
    }

    // Kiểm tra email có tồn tại trong userData không
    const foundUser = userData.find(
      (user) => user.email.toLowerCase() === identifier.trim().toLowerCase()
    );

    if (!foundUser) {
      alert("Email này không tồn tại trong hệ thống");
      return;
    }

    // Lưu userId để đổi mật khẩu sau này và chuyển sang VerifyCodePage
    setUserIdChangepassword(foundUser.id);
    navigate("/verify-code");
  };

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
