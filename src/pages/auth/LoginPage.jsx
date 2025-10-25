import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { colors } from "../../constants/colors";
import { ROUTES } from "../../constants/routes";
import "./LoginPage.css";
import { login as apiLogin } from "../../services/api/auth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // URL/State “from” (nếu PrivateRoute chuyển tới login sẽ gắn from)
  const nextURL = useMemo(() => {
    const fromState = location.state?.from;
    const fromQuery = new URLSearchParams(location.search).get("from");
    return fromState || fromQuery || ROUTES.contracts;
  }, [location.state, location.search]);

  // Nếu đã login thì tự chuyển về trang chính
  useEffect(() => {
    const access =
      localStorage.getItem("sami:access") ||
      localStorage.getItem("accessToken");
    if (access) navigate(ROUTES.contracts, { replace: true });
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

      // Nhánh cần xác minh OTP
      if (res?.requiresOTP) {
        navigate(ROUTES.verifyCode, {
          state: { userId: res.userId, email: email.trim(), from: nextURL },
          replace: true,
        });
        return;
      }

      // Đăng nhập thành công (token đã được lưu trong service)
      navigate(nextURL, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Đăng nhập thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const gotoForgot = (e) => {
    e.preventDefault(); // chặn nhảy #
    navigate(ROUTES.forgotPassword);
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
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: 8,
                  background: "transparent",
                  border: "none",
                  color: colors.brand,
                  cursor: "pointer",
                }}
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <button
            type="submit"
            className="login-btn"
            style={{
              backgroundColor: colors.brand,
              opacity: loading ? 0.8 : 1,
            }}
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>
        </form>

        <a
          onClick={gotoForgot}
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
