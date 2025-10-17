import React, { useState, useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import { colors } from "../../constants/colors";
import "./LoginPage.css";

function LoginPage() {
  const { userData, setUserIdLogin } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // Tìm user theo email
    const foundUser = userData.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (!foundUser) {
      setError("Email không tồn tại!");
      return;
    }

    // Kiểm tra mật khẩu
    if (foundUser.password !== password) {
      setError("Mật khẩu không chính xác!");
      return;
    }

    // Kiểm tra role được phép đăng nhập
    if (foundUser.role !== "Chủ trọ" && foundUser.role !== "Quản lý trọ") {
      setError("Tài khoản không có quyền truy cập hệ thống!");
      return;
    }

    // Đăng nhập thành công
    setError("");
    setUserIdLogin(foundUser.id);
    console.log("Đăng nhập thành công:", foundUser);

    // Chuyển trang (nếu có dùng React Router)
    // navigate("/dashboard");
  };

  return (
    <div className="login-container" style={{ backgroundColor: colors.brand }}>
      <div className="login-box">
        <h2>Đăng Nhập</h2>
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

        <a href="#" className="forgot-password" style={{ color: colors.brand }}>
          Bạn quên mật khẩu?
        </a>
      </div>
    </div>
  );
}

export default LoginPage;
