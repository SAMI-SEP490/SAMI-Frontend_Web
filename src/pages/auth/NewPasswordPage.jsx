import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/api/auth"; // Hàm gọi API reset
import "./AuthCommon.css";

export default function NewPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy info từ state hoặc sessionStorage
  const getContext = () => {
    if (location.state?.userId && location.state?.resetToken) {
      return location.state;
    }
    try {
      return JSON.parse(sessionStorage.getItem("sami:resetCtx") || "{}");
    } catch { return {}; }
  };

  const { userId, resetToken } = getContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return alert("Vui lòng nhập đủ thông tin");
    if (password !== confirmPassword) return alert("Mật khẩu xác nhận không khớp");
    if (!userId || !resetToken) {
      alert("Phiên làm việc hết hạn. Vui lòng thử lại.");
      navigate("/forgot-password");
      return;
    }

    setLoading(true);
    try {
      // Gọi API resetPassword (cần đảm bảo api/auth có hàm này)
      await resetPassword({ userId, token: resetToken, newPassword: password });
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      
      // Clear session
      sessionStorage.removeItem("sami:resetCtx");
      navigate("/login");
    } catch (e) {
      alert(e?.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left" />
      <div className="login-right">
        <div className="login-center">
          <img src="/logo1.png" alt="Logo" className="login-logo" />
          
          <div className="login-box">
            <h2>Mật khẩu mới</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <div className="pw-wrapper">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="show-pw-btn" onClick={() => setShowPw(!showPw)}>
                    {showPw ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
