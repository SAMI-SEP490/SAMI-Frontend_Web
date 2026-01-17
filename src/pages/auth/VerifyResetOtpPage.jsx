import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyResetOTP, resendResetOTP } from "../../services/api/auth";
import "./AuthCommon.css";

function useResetContext() {
  const location = useLocation();
  return useMemo(() => {
    const { state, search } = location;
    const s = new URLSearchParams(search);
    const email = state?.email || s.get("email") || "";

    let userId = state?.userId;
    if (!userId) {
      try {
        const saved = JSON.parse(sessionStorage.getItem("sami:resetCtx") || "{}");
        if (saved.userId) userId = saved.userId;
      } catch (e) {}
    }
    return { email, userId };
  }, [location]);
}

export default function VerifyResetOtpPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { email, userId } = useResetContext();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return alert("Vui lòng nhập mã xác thực");
    if (!/^\d{6}$/.test(code)) return alert("Mã xác thực phải gồm 6 chữ số");

    if (!userId) {
      alert("Thiếu thông tin phiên. Vui lòng thực hiện lại.");
      navigate("/forgot-password", { replace: true });
      return;
    }

    try {
      setLoading(true);
      const res = await verifyResetOTP({ userId, otp: code.trim() });
      const { userId: uid, resetToken, message } = res || {};
      
      if (!uid || !resetToken) throw new Error("Lỗi xác thực từ server");

      try {
        sessionStorage.setItem("sami:resetCtx", JSON.stringify({ userId: uid, resetToken, email }));
      } catch (e) {}

      alert(message || "Xác nhận OTP thành công!");
      navigate("/new-password", { state: { userId: uid, resetToken } });
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Xác thực thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId) return;
    try {
      const res = await resendResetOTP({ userId });
      alert(res?.message || "Đã gửi lại mã");
    } catch (e) {
      alert("Không gửi lại được mã");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left" />
      <div className="login-right">
        <div className="login-center">
          <img src="/logo1.png" alt="Logo" className="login-logo" />
          
          <div className="login-box">
            <h2>Đặt lại mật khẩu</h2>
            <p style={{ marginBottom: 20, color: "#666", fontSize: 14 }}>
              Nhập mã OTP gửi tới <b>{email}</b>
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
                {loading ? "Đang kiểm tra..." : "Xác nhận"}
              </button>
            </form>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
               <span className="forgot-password" onClick={() => navigate("/forgot-password")}>
                Quay lại
              </span>
              <span className="forgot-password" onClick={handleResend} style={{ fontWeight: '600' }}>
                Gửi lại mã
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
