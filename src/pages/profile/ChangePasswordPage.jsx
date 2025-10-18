import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";
import Headers from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { Button, Form, Alert } from "react-bootstrap";

export default function ChangePasswordPage() {
  const { userData, setUserData, userIdLogin } = useContext(UserContext);
  const navigate = useNavigate();

  const loggedInUser = userData.find((user) => user.id == userIdLogin);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("danger");

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setVariant("danger");
      setMessage("Vui lòng nhập đầy đủ các trường!");
      return;
    }

    if (!loggedInUser) {
      setVariant("danger");
      setMessage("Không tìm thấy người dùng.");
      return;
    }

    if (oldPassword !== loggedInUser.password) {
      setVariant("danger");
      setMessage("Mật khẩu cũ không chính xác!");
      return;
    }

    if (newPassword.length < 6) {
      setVariant("danger");
      setMessage("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setVariant("danger");
      setMessage("Mật khẩu nhập lại không khớp!");
      return;
    }

    // ✅ Cập nhật lại userData trong context
    const updatedUsers = userData.map((user) =>
      user.id === userIdLogin ? { ...user, password: newPassword } : user
    );
    setUserData(updatedUsers);

    setVariant("success");
    setMessage("Đổi mật khẩu thành công!");

    // Sau 1.5s quay lại trang profile
    setTimeout(() => navigate("/profile"), 1500);
  };

  if (!loggedInUser) {
    return (
      <div>
        <p>Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.</p>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 10,
          borderRadius: "10px",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Headers />
      </div>

      {/* Nội dung */}
      <div style={{ flex: 1, display: "flex", overflow: "auto" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "220px",
            backgroundColor: colors.brand,
            color: "white",
            height: "100%",
            position: "sticky",
            top: 0,
            borderRadius: "10px",
          }}
        >
          <Sidebar />
        </div>

        {/* Form đổi mật khẩu */}
        <div
          style={{
            flex: 1,
            backgroundColor: colors.background,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "40px 20px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "60%",
              backgroundColor: "#fff",
              borderRadius: "10px",
              padding: "30px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h4
              style={{
                textAlign: "center",
                marginBottom: "20px",
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px",
                }}
              >
                <Button variant="primary" onClick={handleChangePassword}>
                  Xác nhận
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
      </div>
    </div>
  );
}
