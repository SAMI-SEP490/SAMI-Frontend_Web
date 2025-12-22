import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import "./LoginPage.css";
import {
  login as apiLogin,
  logout as apiLogout,
} from "../../services/api/auth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const nextURL = useMemo(() => {
    const fromState = location.state?.from;
    const fromQuery = new URLSearchParams(location.search).get("from");
    return fromState || fromQuery || ROUTES.viewTimebaseReport;
  }, [location.state, location.search]);

  const extractRole = (userObj) => {
    if (!userObj || typeof userObj !== "object") return "";
    return String(
      userObj.role ||
        userObj.role_name ||
        userObj.roleName ||
        userObj.role_code ||
        userObj.roleCode ||
        ""
    )
      .toLowerCase()
      .trim();
  };

  useEffect(() => {
    const access =
      localStorage.getItem("sami:access") ||
      localStorage.getItem("accessToken");

    if (!access) return;

    try {
      const user = JSON.parse(localStorage.getItem("sami:user") || "{}");
      if (extractRole(user).includes("tenant")) {
        [
          "sami:access",
          "accessToken",
          "sami:refresh",
          "refreshToken",
          "sami:user",
        ].forEach((k) => localStorage.removeItem(k));
        return;
      }
      navigate(ROUTES.viewTimebaseReport, { replace: true });
    // eslint-disable-next-line no-empty
    } catch {}
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);
      const res = await apiLogin({ email: email.trim(), password });

      const rawUser =
        res?.user ||
        res?.data?.user ||
        res?.data ||
        JSON.parse(localStorage.getItem("sami:user") || "{}");

      if (extractRole(rawUser).includes("tenant")) {
        try {
          await apiLogout();
        // eslint-disable-next-line no-empty
        } catch {}
        setError(
          "Tài khoản Tenant không được phép đăng nhập web. Vui lòng sử dụng Tenant App."
        );
        return;
      }

      if (res?.requiresOTP) {
        navigate(ROUTES.verifyCode, {
          state: { userId: res.userId, email: email.trim(), from: nextURL },
          replace: true,
        });
        return;
      }

      navigate(nextURL, { replace: true });
    } catch (err) {
      let msg =
        err?.response?.data?.message || err?.message || "Đăng nhập thất bại";

      if (
        err?.response?.status === 401 ||
        msg.toLowerCase().includes("invalid")
      ) {
        msg = "Thông tin đăng nhập không chính xác";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* LEFT */}
      <div className="login-left" />

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-center">
          {/* LOGO – hòa vào nền */}
          <img src="/logo1.png" alt="Logo" className="login-logo" />

          {/* LOGIN BOX */}
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
                <div className="pw-wrapper">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="show-pw-btn"
                    onClick={() => setShowPw((v) => !v)}
                  >
                    {showPw ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
              </button>
            </form>

            <span className="forgot-password">Bạn quên mật khẩu?</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
