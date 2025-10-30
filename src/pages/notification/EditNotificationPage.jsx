import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { NotificationContext } from "../../contexts/NotificationContext";

export default function EditNotificationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notificationData, setNotificationData } =
    useContext(NotificationContext);

  const existing = notificationData.find((n) => n.id === parseInt(id));

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    building: "",
    effectiveDate: "",
    expiryDate: "",
    content: "",
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        title: existing.title || "",
        category: existing.category || "",
        building: existing.building || "",
        effectiveDate: existing.effectiveDate || "",
        expiryDate: existing.expiryDate || "",
        content: existing.content || "",
      });
    }
  }, [existing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSend = () => {
    setNotificationData((prev) =>
      prev.map((n) =>
        n.id === parseInt(id) ? { ...n, ...formData, status: "Đã gửi" } : n
      )
    );
    alert("Thông báo đã được gửi!");
    navigate("/notifications");
  };

  const handleSaveDraft = () => {
    setNotificationData((prev) =>
      prev.map((n) =>
        n.id === parseInt(id) ? { ...n, ...formData, status: "Nháp" } : n
      )
    );
    alert("Đã lưu bản nháp!");
    navigate("/notifications");
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #E2E8F0",
    marginTop: 4,
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
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
        <Header />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
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

        {/* Nội dung chính */}
        <div
          style={{
            flex: 1,
            background: colors.background,
            padding: "24px",
            overflowY: "auto",
          }}
        >
          <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
            Chỉnh sửa quy định / Thông báo
          </h2>

          <form
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {/* Tiêu đề */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600 }}>Tiêu đề quy định</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                type="text"
                style={inputStyle}
              />
            </div>

            {/* Danh mục - Ngày hiệu lực - Ngày hết hạn */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600 }}>Danh mục</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">-- Chọn danh mục --</option>
                  <option value="Thông báo chung">Thông báo chung</option>
                  <option value="Quy định">Quy định</option>
                  <option value="Bảo trì">Bảo trì</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600 }}>Ngày hiệu lực</label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600 }}>Ngày hết hạn</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Nội dung */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600 }}>Nội dung quy định</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows="8"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            {/* Tòa nhà */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600 }}>Tòa nhà</label>
              <select
                name="building"
                value={formData.building}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">-- Chọn tòa nhà --</option>
                <option value="Tòa A">Tòa A</option>
                <option value="Tòa B">Tòa B</option>
                <option value="Tòa C">Tòa C</option>
              </select>
            </div>

            {/* Nút hành động */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 16,
              }}
            >
              <button
                type="button" // ✅ thêm dòng này
                onClick={handleCancel}
                style={{
                  background: "#E5E7EB",
                  color: "#111827",
                  padding: "8px 18px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Hủy
              </button>

              <button
                type="button" // ✅ thêm dòng này
                onClick={handleSaveDraft}
                style={{
                  background: "#0F172A",
                  color: "#fff",
                  padding: "8px 18px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Lưu bản nháp
              </button>

              <button
                type="button" // ✅ thêm dòng này
                onClick={handleSend}
                style={{
                  background: "#0F3D8A",
                  color: "#fff",
                  padding: "8px 18px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Gửi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
