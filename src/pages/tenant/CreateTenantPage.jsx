import React, { useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";

export default function CreateTenantPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
    floor: "",
    room: "",
    startDate: "",
    endDate: "",
    contract: "",
  });
  const [emailVerified, setEmailVerified] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleVerifyEmail = () => {
    if (formData.email.trim() === "") {
      alert("Vui lòng nhập email trước khi xác thực.");
      return;
    }
    setEmailVerified(true);
    alert("Email đã được xác thực!");
  };

  const handleNext = () => {
    if (step === 1) {
      if (
        !formData.name ||
        !formData.dob ||
        !formData.gender ||
        !formData.phone ||
        !formData.address
      ) {
        alert("Vui lòng nhập đầy đủ thông tin cơ bản!");
        return;
      }
    } else if (step === 2) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        alert("Vui lòng nhập đầy đủ thông tin đăng nhập!");
        return;
      }

      // Kiểm tra độ mạnh của mật khẩu
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        alert(
          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ cái in hoa, 1 chữ thường và 1 ký tự đặc biệt!"
        );
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        alert("Mật khẩu nhập lại không khớp!");
        return;
      }

      if (!emailVerified) {
        alert("Vui lòng xác thực email trước khi tiếp tục!");
        return;
      }
    } else if (step === 3) {
      if (
        !formData.floor ||
        !formData.room ||
        !formData.startDate ||
        !formData.endDate ||
        !formData.contract
      ) {
        alert("Vui lòng nhập đầy đủ thông tin phòng!");
        return;
      }
    }

    if (step < 3) setStep(step + 1);
    else alert("Tạo tài khoản thành công!");
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCancel = () => {
    if (window.confirm("Bạn có chắc muốn hủy bỏ quá trình tạo tài khoản?")) {
      window.location.href = "/tenants";
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    marginBottom: 10,
  };

  const sectionStyle = {
    background: "#fff",
    borderRadius: 10,
    padding: "20px 30px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    maxWidth: 450,
    margin: "30px auto",
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {" "}
      <Header />
      <div style={{ display: "flex", flex: 1 }}>
        {" "}
        <Sidebar />
        <div
          style={{ flex: 1, background: colors.background, padding: "24px" }}
        >
          {" "}
          <div style={sectionStyle}>
            <h2 style={{ textAlign: "center", marginBottom: 20 }}>
              Tạo tài khoản
            </h2>

            {step === 1 && (
              <>
                <h4 style={{ color: "#2563EB" }}>Thông tin cơ bản</h4>
                <label>Họ và tên:</label>
                <input
                  style={inputStyle}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                <label>Ngày sinh:</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={formData.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
                <label>Giới tính:</label>
                <div style={{ marginBottom: 10 }}>
                  {["Nam", "Nữ", "Khác"].map((g) => (
                    <label key={g} style={{ marginRight: 12 }}>
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={(e) => handleChange("gender", e.target.value)}
                      />{" "}
                      {g}
                    </label>
                  ))}
                </div>
                <h4 style={{ color: "#2563EB" }}>Thông tin liên hệ</h4>
                <label>Số điện thoại:</label>
                <input
                  style={inputStyle}
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                <label>Địa chỉ thường trú:</label>
                <textarea
                  rows="2"
                  style={inputStyle}
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h4 style={{ color: "#2563EB" }}>Thông tin đăng nhập</h4>
                <label>Email:</label>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <input
                    placeholder="example@gmail.com"
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                  <button
                    style={{
                      background: emailVerified ? "#16A34A" : "#2563EB",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: 6,
                      cursor: "pointer",
                      alignSelf: "center",
                    }}
                    onClick={handleVerifyEmail}
                  >
                    {emailVerified ? "Đã xác thực" : "Xác thực"}
                  </button>
                </div>

                <label>Mật khẩu:</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
                <label>Nhập lại mật khẩu:</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                />
              </>
            )}

            {step === 3 && (
              <>
                <h4 style={{ color: "#2563EB" }}>Thông tin phòng</h4>
                <label>Tầng:</label>
                <select
                  style={inputStyle}
                  value={formData.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
                >
                  <option value="">-- Chọn tầng --</option>
                  <option value="Tầng 1">Tầng 1</option>
                  <option value="Tầng 2">Tầng 2</option>
                </select>
                <label>Phòng:</label>
                <select
                  style={inputStyle}
                  value={formData.room}
                  onChange={(e) => handleChange("room", e.target.value)}
                >
                  <option value="">-- Chọn phòng --</option>
                  <option value="101">101</option>
                  <option value="102">102</option>
                </select>
                <label>Từ ngày:</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                />
                <label>Đến ngày:</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                />
                <label>Hợp đồng:</label>
                <select
                  style={inputStyle}
                  value={formData.contract}
                  onChange={(e) => handleChange("contract", e.target.value)}
                >
                  <option value="">Chưa có hợp đồng</option>
                  <option value="Có hợp đồng">Có hợp đồng</option>
                </select>
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginTop: 20,
              }}
            >
              {step !== 1 && (
                <button
                  onClick={handleBack}
                  style={{
                    background: "#1E3A8A",
                    color: "#fff",
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Quay lại
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  background: "#1E3A8A",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {step === 3 ? "Tạo tài khoản" : "Tiếp tục"}
              </button>
              <button
                onClick={handleCancel}
                style={{
                  background: "#1E3A8A",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
