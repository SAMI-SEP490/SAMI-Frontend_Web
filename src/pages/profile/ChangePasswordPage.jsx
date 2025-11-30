import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { Button, Form, Alert } from "react-bootstrap";
import { changePassword } from "../../services/api/auth";

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("danger");
  const [loading, setLoading] = useState(false);

  const hasToken =
    !!localStorage.getItem("sami:access") ||
    !!localStorage.getItem("accessToken");
  if (!hasToken) {
    return (
      <div className="p-3">
        Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.
      </div>
    );
  }

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setVariant("danger");
      setMessage("Vui lòng nhập đầy đủ các trường!");
      return;
    }

    // ✅ VALIDATE MẬT KHẨU MỚI THEO YÊU CẦU MỚI
    const strongPasswordRegex = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      setVariant("danger");
      setMessage("Mật khẩu phải có ít nhất 8 kí tự, 1 số và 1 kí tự đặc biệt");
      return;
    }

    if (newPassword !== confirmPassword) {
      setVariant("danger");
      setMessage("Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await changePassword({
        currentPassword: oldPassword,
        newPassword,
      });

      setVariant("success");
      setMessage("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => navigate("/profile"), 1200);
    } catch (e) {
      const status = e?.response?.status;
      let msg = e?.response?.data?.message || "Đổi mật khẩu thất bại!";

      // ✅ MAP LẠI LỖI SAI MẬT KHẨU CŨ
      if (
        status === 400 ||
        status === 404 ||
        /route not found/i.test(msg) ||
        /incorrect current password/i.test(msg)
      ) {
        msg = "Mật khẩu cũ không chính xác";
      }

      setVariant("danger");
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        backgroundColor: colors.background,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "60%",
          backgroundColor: "#fff",
          borderRadius: 10,
          padding: 30,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h4
          style={{
            textAlign: "center",
            marginBottom: 20,
            color: colors.brand,
          }}
        >
          Đổi mật khẩu
        </h4>

        {message && <Alert variant={variant}>{message}</Alert>}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Mật khẩu cũ</Form.Label>
            <Form.Control
              type="password"
              placeholder="Nhập mật khẩu cũ"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mật khẩu mới</Form.Label>
            <Form.Control
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Nhập lại mật khẩu mới</Form.Label>
            <Form.Control
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Form.Group>

          <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
            <Button
              variant="primary"
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => navigate("/profile")}
            >
              Quay lại
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
