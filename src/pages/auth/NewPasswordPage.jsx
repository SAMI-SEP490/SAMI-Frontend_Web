import React, { useState, useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import { colors } from "../../constants/colors";
import { useNavigate } from "react-router-dom";

export default function NewPasswordPage() {
  const { userData, setUserData, userIdChangepassword } = useContext(UserContext);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-={}[\]|\\:;"'<>,.?/~`]).+$/;
    return passwordRegex.test(password);
  };

  const handleConfirm = () => {
    if (!password || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (!validatePassword(password)) {
      alert(
        "Mật khẩu yếu. Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 ký tự đặc biệt."
      );
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp.");
      return;
    }

    // Cập nhật mật khẩu cho user tương ứng
    const updatedUsers = userData.map((user) =>
      user.id === userIdChangepassword ? { ...user, password } : user
    );
    setUserData(updatedUsers);

    alert("Mật khẩu đã được thay đổi!");
    navigate("/login");
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
          borderRadius: "16px",
          padding: "30px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "10px" }}>
          Tạo mật khẩu mới
        </h2>
        <p style={{ fontSize: "14px", color: "#555", marginBottom: "20px", textAlign: "center" }}>
          Hãy nhập mật khẩu mới để hoàn tất việc đặt lại tài khoản.
        </p>

        <input
          type="password"
          placeholder="Nhập mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            height: "48px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            padding: "12px",
            marginBottom: "15px",
          }}
        />

        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{
            width: "100%",
            height: "48px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            padding: "12px",
            marginBottom: "20px",
          }}
        />

        <button
          onClick={handleConfirm}
          style={{
            width: "100%",
            backgroundColor: colors.brand,
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            padding: "12px",
            borderRadius: "10px",
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
