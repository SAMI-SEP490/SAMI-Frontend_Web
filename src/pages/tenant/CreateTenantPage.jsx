// src/pages/tenant/CreateTenantPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { registerUser, changeManagerToTenant } from "../../services/api/users";
import { listRoomsLite } from "../../services/api/rooms";

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
    room: "", // room_id thật
    idNumber: "",

    // Bước 2
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field, value) =>
    setFormData((s) => ({ ...s, [field]: value }));

  const onlyDigits = (v) => String(v || "").replace(/\D/g, "");

  // Map gender sang đúng enum backend: "Male" | "Female" | "Other"
  const mapGenderForServer = (g) => {
    if (!g) return undefined;
    const key = String(g).trim().toLowerCase();
    if (key === "nam" || key === "male") return "Male";
    if (key === "nữ" || key === "nu" || key === "female") return "Female";
    return "Other";
  };

  // ====== Lấy danh sách phòng từ API ======
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setRoomsLoading(true);
        setRoomsError("");
        const apiRooms = await listRoomsLite();
        if (!mounted) return;

        const list = Array.isArray(apiRooms) ? apiRooms : [];
        setRooms(
          list.map((r) => ({
            id: String(r.id),
            label: String(r.label ?? r.name ?? r.room_number ?? r.id),
          }))
        );
      } catch (e) {
        if (!mounted) return;
        console.error("Load rooms error:", e);
        setRoomsError(
          "Không tải được danh sách phòng. Hãy kiểm tra lại kết nối hoặc backend."
        );
      } finally {
        if (mounted) setRoomsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleNext = async () => {
    // ====== STEP 1: validate thông tin cơ bản ======
    if (step === 1) {
      if (
        !formData.name ||
        !formData.dob ||
        !formData.gender ||
        !formData.phone ||
        !formData.room ||
        !formData.idNumber
      ) {
        alert("Vui lòng nhập đủ Thông tin cơ bản (bao gồm Phòng & CCCD)!");
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

      setStep(2);
      return;
    }

    // ====== STEP 2: đăng ký + change-to-tenant ======
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin đăng nhập!");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      alert(
        "Mật khẩu phải ≥8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt."
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

      // 1. Đăng ký user
      const user = await registerUser({
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: onlyDigits(formData.phone),
        gender: mapGenderForServer(formData.gender),
        birthday: formData.dob,
      });

      // 2. Lấy userId từ response
      const userId =
        user?.user_id ?? user?.id ?? user?.uid ?? user?._id ?? user?.data?.id;

      if (!userId) {
        console.error("Register response (unexpected shape):", user);
        alert("Không lấy được userId sau khi đăng ký.");
        return;
      }

      // 3. Lấy roomId từ list phòng
      const room = rooms.find((r) => String(r.id) === String(formData.room));
      const roomId = room ? Number(room.id) || room.id : null;

      if (!roomId) {
        alert("Không tìm được phòng hợp lệ, vui lòng chọn lại.");
        return;
      }

      // 4. Chuẩn hóa CCCD
      const idNumber =
        onlyDigits(formData.idNumber) ||
        onlyDigits(Date.now()).slice(-12) ||
        "000000000000";

      // 5. Gọi /user/change-to-tenant
      await changeManagerToTenant({
        userId,
        roomId,
        idNumber,
        // backend vẫn yêu cầu emergencyContactPhone, gửi luôn phone chính
        emergencyContactPhone: onlyDigits(formData.phone).slice(0, 11),
        note: room ? `Phòng: ${room.label}` : "",
      });

      alert("Tạo tài khoản & gán người thuê thành công!");
      navigate("/tenants", { replace: true });
    } catch (err) {
      console.error(err);
      const d = err?.response?.data;
      const msg =
        (Array.isArray(d?.errors) && d.errors[0]?.message) ||
        d?.message ||
        d?.error ||
        err?.message ||
        "Tạo tài khoản thất bại. Vui lòng thử lại.";
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
    <div style={{ flex: 1, background: colors.background, padding: "24px" }}>
      <div style={sectionStyle}>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Tạo tài khoản</h2>

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
              disabled={roomsLoading || !!roomsError}
            >
              <option value="">
                {roomsLoading
                  ? "Đang tải danh sách phòng..."
                  : "-- Chọn phòng --"}
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {roomsError && (
              <div style={{ color: "#b91c1c", marginBottom: 8 }}>
                {roomsError}
              </div>
            )}
            {!roomsError && rooms.length === 0 && !roomsLoading && (
              <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>
                Chưa có phòng nào trong hệ thống. Hãy tạo phòng trước khi thêm
                người thuê.
              </div>
            )}

            <label>CCCD/CMND (ID Number):</label>
            <input
              placeholder="Nhập 9–12 chữ số"
              style={inputStyle}
              value={formData.idNumber}
              onChange={(e) => handleChange("idNumber", e.target.value)}
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
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
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
  );
}
