import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { colors } from "../../constants/colors";
import { NotificationContext } from "../../contexts/NotificationContext";

export default function EditNotificationPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { notificationData, setNotificationData } =
    useContext(NotificationContext);

  const existing = notificationData.find((n) => n.id === id);

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    category: "",
    effectiveDate: "",
    expiryDate: "",
    content: "",
    building: "",
    attachmentName: "",
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        code: existing.code || "",
        title: existing.title || "",
        category: existing.category || "",
        effectiveDate: existing.effectiveDate || "",
        expiryDate: existing.expiryDate || "",
        content: existing.content || "",
        building: existing.building || "",
        attachmentName: existing.attachment || "",
      });
    }
  }, [existing]);

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginTop: "5px",
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment" && files && files.length > 0) {
      setFormData((prev) => ({ ...prev, attachmentName: files[0].name }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const updateNotification = (status) => {
    if (!existing) return;
    const updated = {
      ...existing,
      ...formData,
      attachment: formData.attachmentName,
      status,
      updatedAt: new Date().toISOString(),
    };

    setNotificationData((prev) =>
      prev.map((item) => (item.id === existing.id ? updated : item))
    );
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    updateNotification("Nháp");
    alert("Đã lưu bản nháp.");
  };

  const handleSend = (e) => {
    e.preventDefault();
    updateNotification("Đã gửi");
    alert("Đã gửi thông báo.");
    navigate("/notifications");
  };

  const handleCancel = (e) => {
    e.preventDefault();
    navigate("/notifications");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
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
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Code + Title */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Mã quy định</label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              type="text"
              style={inputStyle}
            />
          </div>

          <div style={{ flex: 3 }}>
            <label>Tiêu đề quy định</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              type="text"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Category + Dates */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Danh mục</label>
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
            <label>Ngày hiệu lực</label>
            <input
              name="effectiveDate"
              value={formData.effectiveDate}
              onChange={handleChange}
              type="date"
              style={inputStyle}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label>Ngày hết hạn</label>
            <input
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              type="date"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 12 }}>
          <label>Nội dung quy định</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="8"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Building + Attachment */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-end",
            marginBottom: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <label>Tòa nhà</label>
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

          <div style={{ flex: 1 }}>
            <label>Đính kèm</label>
            <input
              name="attachment"
              type="file"
              onChange={handleChange}
              style={{ marginTop: 6 }}
            />
            {formData.attachmentName && (
              <div style={{ marginTop: 8, color: "#374151" }}>
                Tệp đã chọn: {formData.attachmentName}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 16,
          }}
        >
          <button
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

          <button
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
        </div>
      </form>
    </div>
  );
}
