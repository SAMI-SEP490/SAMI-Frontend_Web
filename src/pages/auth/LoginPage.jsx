import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { colors } from "../../constants/colors";
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

  // URL/State “from” (nếu PrivateRoute chuyển tới login sẽ gắn from)
  const nextURL = useMemo(() => {
    const fromState = location.state?.from;
    const fromQuery = new URLSearchParams(location.search).get("from");
    return fromState || fromQuery || ROUTES.contracts;
  }, [location.state, location.search]);

  // Helper: lấy role từ object user bất kỳ
  const extractRole = (userObj) => {
    if (!userObj || typeof userObj !== "object") return "";
    const rawRole =
      userObj.role ||
      userObj.role_name ||
      userObj.roleName ||
      userObj.role_code ||
      userObj.roleCode ||
      "";
    return String(rawRole || "")
      .toLowerCase()
      .trim();
  };

  // Nếu đã login thì tự chuyển về trang chính (nhưng phải check không phải tenant)
  useEffect(() => {
    const access =
      localStorage.getItem("sami:access") ||
      localStorage.getItem("accessToken");

    if (!access) return;

    const userStr = localStorage.getItem("sami:user");
    if (userStr) {
      try {
        const savedUser = JSON.parse(userStr);
        const roleStr = extractRole(savedUser);
        const isTenant =
          roleStr === "tenant" ||
          roleStr === "r_tenant" ||
          roleStr.includes("tenant");

        // Nếu là tenant thì ko cho auto-redirect, dọn session luôn
        if (isTenant) {
          [
            "sami:access",
            "accessToken",
            "sami:refresh",
            "refreshToken",
            "sami:user",
          ].forEach((k) => localStorage.removeItem(k));
          return;
        }
      } catch {
        // Nếu parse lỗi thì cứ cho qua, không redirect
        return;
      }
    }

    // Không phải tenant -> cho vào hệ thống như cũ
    navigate(ROUTES.contracts, { replace: true });
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

      // Lấy user + role từ response (linh hoạt nhiều dạng BE trả về)
      const rawUser =
        res?.user ||
        res?.data?.user ||
        res?.data ||
        res ||
        JSON.parse(localStorage.getItem("sami:user") || "{}");

      const roleStr = extractRole(rawUser);
      const isTenant =
        roleStr === "tenant" ||
        roleStr === "r_tenant" ||
        roleStr.includes("tenant");

      if (isTenant) {
        try {
          await apiLogout();
        } catch {
          // ignore lỗi logout
        }

        setError(
          "Tài khoản Tenant không được phép đăng nhập vào hệ thống web. Vui lòng sử dụng ứng dụng dành cho cư dân (Tenant App)."
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
        err?.response?.data?.message ||
        err?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";

      // Nếu sai email/mật khẩu → luôn hiển thị tiếng Việt
      const status = err?.response?.status;
      const lower = String(msg || "").toLowerCase();

      if (
        status === 401 ||
        lower.includes("invalid credential") ||
        lower.includes("unauthorized")
      ) {
        msg = "Thông tin đăng nhập không chính xác";
      }

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
