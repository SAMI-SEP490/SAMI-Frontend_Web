import { useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import { colors } from "../../constants/colors";
import Headers from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { Button } from "react-bootstrap";

export default function ProfilePage() {
  const { userData, userIdLogin } = useContext(UserContext);

  // Tìm user đang đăng nhập
  const loggedInUser = userData.find((user) => user.id == userIdLogin);
  console.log(loggedInUser);
  
  // Trường hợp không có dữ liệu user
  if (!loggedInUser) {
    return (
      <div>
        <p>Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header cố định ở trên */}
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

      {/* Phần nội dung bên dưới header */}
      <div style={{ flex: 1, display: "flex", overflow: "auto" }}>
        {/* Sidebar cố định bên trái */}
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

        {/* Nội dung chính bên phải */}
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
          {/* Ảnh đại diện */}
          <img
            src={loggedInUser.avatar_url || "https://via.placeholder.com/120"}
            alt="Avatar"
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "30px",
            }}
          />

          {/* Thông tin cơ bản */}
          <div
            style={{
              width: "60%",
              backgroundColor: "#fff",
              borderRadius: "10px",
              marginBottom: "20px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: colors.brand,
                color: "#fff",
                padding: "10px 20px",
                fontWeight: "bold",
                borderTopLeftRadius: "10px",
                borderTopRightRadius: "10px",
              }}
            >
              Thông tin cơ bản
            </div>
            <div style={{ padding: "20px" }}>
              <p>
                <strong>Tên:</strong> {loggedInUser.full_name || "Null"}
              </p>
              <p>
                <strong>Ngày sinh:</strong> {loggedInUser.birthday || "Null"}
              </p>
              <p>
                <strong>Giới tính:</strong> {loggedInUser.gender || "Null"}
              </p>
              <p>
                <strong>Vai trò:</strong> {loggedInUser.role || "Null"}
              </p>
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div
            style={{
              width: "60%",
              backgroundColor: "#fff",
              borderRadius: "10px",
              marginBottom: "30px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: colors.brand,
                color: "#fff",
                padding: "10px 20px",
                fontWeight: "bold",
                borderTopLeftRadius: "10px",
                borderTopRightRadius: "10px",
              }}
            >
              Thông tin liên hệ
            </div>
            <div style={{ padding: "20px" }}>
              <p>
                <strong>Email:</strong> {loggedInUser.email || "abc@gmail.com"}
              </p>
              <p>
                <strong>SĐT:</strong> {loggedInUser.phone || "0123456789"}
              </p>
            </div>
          </div>

          {/* Các nút hành động */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <Button variant="outline-primary">Thay đổi mật khẩu</Button>
            <Button variant="primary">Sửa</Button>
            <Button variant="outline-secondary">Quay lại</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
