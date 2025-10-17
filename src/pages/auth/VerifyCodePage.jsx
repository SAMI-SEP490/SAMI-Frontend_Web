import React, { useState, useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import { colors } from "../../constants/colors";
import { useNavigate } from "react-router-dom";

export default function VerifyCodePage() {
  const { trueCode } = useContext(UserContext);
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleVerify = () => {
    if (!code.trim()) {
      alert("Vui lòng nhập mã xác thực");
      return;
    }

    if (code.length !== 6) {
      alert("Mã xác thực phải gồm 6 chữ số");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      alert("Mã xác thực chỉ được chứa chữ số");
      return;
    }

    if (code === trueCode) {
      alert("Mã xác thực chính xác!");
      navigate("/new-password");
    } else {
      alert("Mã xác thực không đúng, vui lòng thử lại.");
    }
  };

  const handleResend = () => {
    alert("Mã xác thực đã được gửi lại!");
    // Ở đây bạn có thể gọi API gửi lại mã nếu muốn
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
          Xác minh mã
        </h2>
        <p style={{ color: "#555", fontSize: "14px", marginBottom: "20px" }}>
          Nhập mã xác thực được gửi tới email của bạn
        </p>

        <input
          type="text"
          placeholder="Nhập mã 6 ký tự"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textAlign: "center",
            letterSpacing: "8px",
            marginBottom: "20px",
          }}
        />

        <button
          onClick={handleVerify}
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
            marginBottom: "10px",
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
            padding: "12px",
            borderRadius: "6px",
            fontSize: "14px",
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
