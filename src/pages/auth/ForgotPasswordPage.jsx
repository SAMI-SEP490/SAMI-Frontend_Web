import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/api/auth";
import { listTenants } from "../../services/api/users";
import "./AuthCommon.css"; // Đảm bảo bạn đã đổi tên hoặc import đúng file CSS

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = async (e) => {
    e.preventDefault(); // Prevent reload form
    const trimmed = email.trim();

    if (!trimmed) {
      alert("Vui lòng nhập email khôi phục");
      return;
    }

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(trimmed)) {
      alert("Vui lòng nhập email đúng định dạng.");
      return;
    }

    setLoading(true);

    try {
      // 1. Check Tenant
      let isTenant = false;
      try {
        const tenants = await listTenants();
        const lower = trimmed.toLowerCase();
        const foundTenant = tenants.find((t) => {
          const tEmail = String(t.email || t.user_email || t.userEmail || "").toLowerCase();
          return tEmail === lower;
        });
        if (foundTenant) isTenant = true;
      } catch (checkErr) {
        console.warn("Lỗi check tenant:", checkErr);
      }

      if (isTenant) {
        alert("Người thuê không có quyền sử dụng chức năng này!");
        setLoading(false);
        return;
      }

      // 2. Call API Forgot Password
      const res = await forgotPassword(trimmed);
      const rawMsg = String(res?.message || "").toLowerCase();

      if (rawMsg.includes("does not exist")) {
        alert("Email không tồn tại trong hệ thống");
        setLoading(false);
        return;
      }

      const userId = res?.userId;
      try {
        sessionStorage.setItem("sami:resetCtx", JSON.stringify({ userId, email: trimmed }));
      } catch (e) {}

      alert(res?.message || "Đã gửi mã xác thực tới email của bạn.");
      navigate(`/verify-reset-otp?email=${encodeURIComponent(trimmed)}`, {
        state: { email: trimmed, userId },
      });

    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Không gửi được mã. Thử lại sau.";
      alert(msg);
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
            <h2>Quên Mật Khẩu</h2>
            <p style={{ marginBottom: 20, color: "#666", fontSize: 14 }}>
              Nhập email để nhận mã xác thực
            </p>

            <form onSubmit={handleNext}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Đang xử lý..." : "Tiếp theo"}
              </button>
            </form>

            <span className="forgot-password" onClick={() => navigate("/login")}>
              Quay lại đăng nhập
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
