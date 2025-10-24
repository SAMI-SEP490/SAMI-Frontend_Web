import React, { useState } from "react";
import { colors } from "../../constants/colors";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../../services/api/auth"; // NEW: gọi API thật

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Giữ nguyên validate rỗng; thay logic đăng nhập bằng API
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      // Gọi backend: có thể trả requiresOTP hoặc trả luôn access/refresh token
      const res = await apiLogin({ email, password });

      if (res?.requiresOTP) {
        // Giữ UI, chỉ điều hướng sang màn xác minh OTP
        navigate("/verify-code", {
          state: {
            userId: res.userId,
            email,
            from: { pathname: "/contracts" },
          },
          replace: true,
        });
        return;
      }

      // Đăng nhập xong (token đã được lưu trong service) → điều hướng như cũ
      alert("Đăng nhập thành công!");
      navigate("/contracts");
    } catch (err) {
      const msg = err?.response?.data?.message || "Đăng nhập thất bại";
      setError(msg);
    }
  };

  return (
    <div className="login-container" style={{ backgroundColor: colors.brand }}>
      <div className="login-box">
        <h2>Đăng Nhập</h2>

        {/* Giữ nguyên UI; chỉ đổi onClick -> onSubmit cho đúng hành vi form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            type="submit"
            className="login-btn"
            style={{ backgroundColor: colors.brand }}
          >
            Đăng Nhập
          </button>
        </form>

        <a
          onClick={() => navigate("/forgot-password")}
          href="#"
          className="forgot-password"
          style={{ color: colors.brand }}
        >
          Bạn quên mật khẩu?
        </a>
      </div>
    </div>
  );
}

export default LoginPage;
