import React, { useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { useNavigate } from "react-router-dom";
import { registerTenantQuick } from "../../services/api/tenants"; // ✅ Đúng file

export default function CreateTenantPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    // Bước 1
    name: "",
    dob: "",
    gender: "",
    phone: "",
    address: "", // làm TUỲ CHỌN
    room: "",
    idNumber: "",
    emergencyPhone: "",

    // Bước 2
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field, value) =>
    setFormData((s) => ({ ...s, [field]: value }));

  const onlyDigits = (v) => String(v || "").replace(/\D/g, "");

  const handleNext = async () => {
    if (step === 1) {
      // ✅ BỎ address khỏi validation bắt buộc
      if (
        !formData.name ||
        !formData.dob ||
        !formData.gender ||
        !formData.phone ||
        !formData.room ||
        !formData.idNumber
      ) {
        alert("Vui lòng nhập đầy đủ thông tin cơ bản (bao gồm Phòng & CCCD)!");
        return;
      }

      if (onlyDigits(formData.phone).length < 10) {
        alert("Số điện thoại phải có ít nhất 10 chữ số.");
        return;
      }

      const idLen = onlyDigits(formData.idNumber).length;
      if (idLen < 9 || idLen > 12) {
        alert("CCCD/CMND phải có từ 9 đến 12 chữ số.");
        return;
      }

      if (
        formData.emergencyPhone &&
        (onlyDigits(formData.emergencyPhone).length < 10 ||
          onlyDigits(formData.emergencyPhone).length > 11)
      ) {
        alert("Số liên hệ khẩn cấp (nếu nhập) phải có 10–11 chữ số.");
        return;
      }

      setStep(2);
      return;
    }

    // Bước 2
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin đăng nhập!");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      alert(
        "Mật khẩu phải có ít nhất 8 ký tự, gồm 1 chữ hoa, 1 chữ thường và 1 ký tự đặc biệt!"
      );
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    if (saving) return;
    try {
      setSaving(true);

      await registerTenantQuick({
        // map sang BE (hàm nằm trong services/api/tenants.js)
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        gender: formData.gender, // "Nam"|"Nữ"|"Khác" -> service sẽ map nếu cần
        birthday: formData.dob, // yyyy-mm-dd

        idNumber: formData.idNumber,
        emergencyPhone: formData.emergencyPhone || "",

        // tuỳ chọn, không bắt buộc
        address: formData.address || "",
        room: formData.room,
      });

      alert("Tạo tài khoản thành công!");
      navigate("/tenants", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Tạo tenant thất bại. Vui lòng thử lại.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCancel = () => {
    if (window.confirm("Bạn có chắc muốn hủy bỏ quá trình tạo tài khoản?")) {
      navigate("/tenants", { replace: true });
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
      <Header />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <div
          style={{ flex: 1, background: colors.background, padding: "24px" }}
        >
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

                <h4 style={{ color: "#2563EB" }}>Liên hệ & Phòng</h4>

                <label>Số điện thoại:</label>
                <input
                  style={inputStyle}
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />

                <label>Phòng:</label>
                <select
                  style={inputStyle}
                  value={formData.room}
                  onChange={(e) => handleChange("room", e.target.value)}
                >
                  <option value="">-- Chọn phòng --</option>
                  <option value="101">101</option>
                  <option value="102">102</option>
                  <option value="201">201</option>
                  <option value="202">202</option>
                </select>

                <label>CCCD/CMND (ID Number):</label>
                <input
                  placeholder="Nhập 9–12 chữ số"
                  style={inputStyle}
                  value={formData.idNumber}
                  onChange={(e) => handleChange("idNumber", e.target.value)}
                />

                <label>Số liên hệ khẩn cấp (tuỳ chọn):</label>
                <input
                  placeholder="10–11 chữ số, mặc định dùng SĐT chính"
                  style={inputStyle}
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    handleChange("emergencyPhone", e.target.value)
                  }
                />
              </>
            )}

            {step === 2 && (
              <>
                <h4 style={{ color: "#2563EB" }}>Thông tin đăng nhập</h4>

                <label>Email:</label>
                <input
                  placeholder="example@gmail.com"
                  style={inputStyle}
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />

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
                  type="button"
                  onClick={handleBack}
                  style={{
                    background: "#1E3A8A",
                    color: "#fff",
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                  }}
                  disabled={saving}
                >
                  Quay lại
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                style={{
                  background: "#1E3A8A",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
                disabled={saving}
              >
                {step === 2
                  ? saving
                    ? "Đang tạo..."
                    : "Tạo tài khoản"
                  : "Tiếp tục"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: "#1E3A8A",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
                disabled={saving}
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
