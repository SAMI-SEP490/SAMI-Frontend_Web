import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";
import Headers from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { Form, Button, Alert, Image } from "react-bootstrap";

export default function EditProfilePage() {
  const { userData, userIdLogin, setUserData } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận user truyền từ trang trước (ProfilePage)
  const incomingUser = location.state?.user;
  const user = userData.find((u) => u.id === userIdLogin) || incomingUser;

  const [name, setName] = useState(user?.full_name || "");
  const [dob, setDob] = useState(user?.birthday || "");
  const [gender, setGender] = useState(
    user?.gender === "male" ? "Nam" : user?.gender === "female" ? "Nữ" : "Khác"
  );
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatar] = useState(user?.avatar || "");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("danger");

  const handleSave = () => {
    // 1️⃣ Kiểm tra trống
    if (!name.trim() || !dob.trim() || !email.trim() || !phone.trim()) {
      setVariant("danger");
      setMessage("Vui lòng nhập đầy đủ tất cả các trường.");
      return;
    }

    // 2️⃣ Kiểm tra ngày sinh DD-MM-YYYY hoặc DD/MM/YYYY
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[0-2])[-/]\d{4}$/;
    if (!dobRegex.test(dob.trim())) {
      setVariant("danger");
      setMessage(
        "Ngày sinh phải theo định dạng DD-MM-YYYY (ví dụ: 06-03-1998)."
      );
      return;
    }

    // 3️⃣ Kiểm tra số điện thoại
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      setVariant("danger");
      setMessage("Số điện thoại phải gồm 10 số và bắt đầu bằng 0.");
      return;
    }

    // 4️⃣ Kiểm tra email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setVariant("danger");
      setMessage("Email không hợp lệ, vui lòng kiểm tra lại.");
      return;
    }

    // 5️⃣ Cập nhật dữ liệu user trong context
    const updatedData = userData.map((u) =>
      u.id === userIdLogin
        ? {
            ...u,
            full_name: name.trim(),
            birthday: dob.trim(),
            gender:
              gender === "Nam" ? "male" : gender === "Nữ" ? "female" : "other",
            email: email.trim(),
            phone: phone.trim(),
          }
        : u
    );
    setUserData(updatedData);

    // 6️⃣ Thông báo thành công
    setVariant("success");
    setMessage("Thông tin đã được cập nhật thành công!");

    setTimeout(() => navigate("/profile"), 1500);
  };

  if (!user) {
    return <p>Không tìm thấy thông tin người dùng.</p>;
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

        {/* Form chỉnh sửa hồ sơ */}
        <div
          style={{
            flex: 1,
            backgroundColor: colors.background,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
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
            <h4 style={{ textAlign: "center", color: colors.brand }}>
              Chỉnh sửa hồ sơ
            </h4>

            {message && <Alert variant={variant}>{message}</Alert>}

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Image
                src={avatar}
                roundedCircle
                style={{ width: 120, height: 120, objectFit: "cover" }}
              />
              <div>
                <Button
                  variant="link"
                  onClick={() =>
                    alert("Bạn có thể dùng chức năng chọn ảnh sau này.")
                  }
                >
                  <i className="bi bi-camera"></i> Đổi ảnh
                </Button>
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <Section title="Thông tin cơ bản">
              <Form.Group className="mb-3">
                <Form.Label>Tên</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ngày sinh</Form.Label>
                <Form.Control
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="VD: 06-03-1998"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Giới tính</Form.Label>
                <GenderSelect value={gender} onChange={setGender} />
              </Form.Group>
            </Section>

            <div style={{ height: 20 }} />

            {/* Thông tin liên hệ */}
            <Section title="Thông tin liên hệ">
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: example@email.com"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0912345678"
                />
              </Form.Group>
            </Section>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                marginTop: "25px",
              }}
            >
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/profile")}
              >
                Quay lại
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Lưu
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          alignSelf: "flex-start",
          backgroundColor: colors.brand,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          padding: "8px 12px",
          color: "#fff",
          fontWeight: "600",
        }}
      >
        {title}
      </div>
      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          padding: "16px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function GenderSelect({ value, onChange }) {
  const genders = ["Nam", "Nữ", "Khác"];
  return (
    <div style={{ display: "flex", gap: "10px" }}>
      {genders.map((g) => {
        const active = value === g;
        return (
          <Button
            key={g}
            variant={active ? "primary" : "outline-secondary"}
            style={{
              borderRadius: "20px",
              padding: "5px 15px",
              backgroundColor: active ? "#E6F0FF" : "transparent",
              color: active ? colors.brand : colors.text,
              borderColor: active ? colors.brand : colors.border,
            }}
            onClick={() => onChange(g)}
          >
            {g}
          </Button>
        );
      })}
    </div>
  );
}
