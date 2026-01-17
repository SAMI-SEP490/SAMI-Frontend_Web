import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOTP } from "../../services/api/auth";
import "./AuthCommon.css";

export default function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userId = location.state?.userId;
  const userEmail = location.state?.email;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return alert("Vui lòng nhập mã xác thực");
    if (code.length !== 6) return alert("Mã xác thực phải gồm 6 chữ số");
    if (!/^\d{6}$/.test(code)) return alert("Mã xác thực chỉ được chứa chữ số");

    if (!userId) {
      alert("Thiếu thông tin phiên đăng nhập. Vui lòng đăng nhập lại.");
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    try {
      await verifyOTP({ userId, otp: code.trim() });
      const back = location.state?.from?.pathname || "/profile"; // Mặc định hoặc trang trước đó
      navigate(back, { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.message || "OTP không hợp lệ";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    alert("Mã xác thực đã được gửi lại!");
  };

  return (
    <div className="login-wrapper">
      <div className="login-left" />
      <div className="login-right">
        <div className="login-center">
          <img src="/logo1.png" alt="Logo" className="login-logo" />
          
          <div className="login-box">
            <h2>Xác thực OTP</h2>
            <p style={{ marginBottom: 20, color: "#666", fontSize: 14 }}>
              Nhập mã 6 số đã gửi tới <b>{userEmail}</b>
            </p>

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="------"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  style={{ textAlign: "center", letterSpacing: 8, fontSize: 18 }}
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Đang xác minh..." : "Xác nhận"}
              </button>
            </form>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
               <span className="forgot-password" onClick={() => navigate("/login")}>
                Quay lại
              </span>
              <span className="forgot-password" onClick={handleResend} style={{ fontWeight: '600' }}>
                Gửi lại mã?
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
