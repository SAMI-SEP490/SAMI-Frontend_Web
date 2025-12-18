// src/pages/notification/CreateNotificationPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { sendBroadcastNotification } from "../../services/api/notification";
import { ROUTES } from "../../constants/routes";

export default function CreateNotificationPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    category: "",
    content: "",
    building: "",
    attachmentName: "",
    publishAt: "", // thời gian hiển thị trên app (datetime-local)
  });

  const [isSending, setIsSending] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #CBD5E1",
    fontSize: 14,
  };

  // format "YYYY-MM-DDTHH:mm" cho input datetime-local
  const getNowLocalInputValue = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment" && files && files.length > 0) {
      setFormData((prev) => ({ ...prev, attachmentName: files[0].name }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.notifications);
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    alert(
      "Hiện tại hệ thống chưa lưu bản nháp lên backend.\nBạn có thể giữ tab này mở để chỉnh sửa tiếp trước khi gửi."
    );
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      alert("Vui lòng nhập tối thiểu Tiêu đề và Nội dung thông báo.");
      return;
    }

    // ✅ Validate: không cho chọn thời gian quá khứ
    if (formData.publishAt) {
      const selected = new Date(formData.publishAt); // datetime-local → local time
      const now = new Date();
      if (selected < now) {
        alert("Thời gian hiển thị trên app không được ở trong quá khứ.");
        return;
      }
    }

    const payload = {
      code: formData.code || "",
      category: formData.category || "",
      content: formData.content || "",
      building: formData.building || "",
      attachmentName: formData.attachmentName || "",
      type: "REGULATION",
      publishAt: formData.publishAt || null, // null hoặc "" = hiện ngay
    };

    try {
      setIsSending(true);
      await sendBroadcastNotification({
        title: formData.title,
        body: formData.content,
        payload,
      });

      alert("Đã gửi thông báo cho cư dân trên app.");
      navigate(ROUTES.notifications);
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("Gửi thông báo thất bại. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: 24,
      }}
    >
      <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
        Tạo mới quy định / Thông báo
      </h2>

      <form
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
          maxWidth: 900,
        }}
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
            <label>Tiêu đề quy định / thông báo</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              type="text"
              style={inputStyle}
              placeholder="Ví dụ: Thông báo cắt điện ngày 30/11"
            />
          </div>
        </div>

        {/* Category + Thời gian publish */}
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
            <label>Thời gian hiển thị trên app</label>
            <input
              type="datetime-local"
              name="publishAt"
              value={formData.publishAt}
              onChange={handleChange}
              style={inputStyle}
              min={getNowLocalInputValue()} // ✅ không cho chọn quá khứ
            />
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
              Nếu để trống, thông báo sẽ hiển thị ngay khi bạn bấm <b>"Gửi"</b>.
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 12 }}>
          <label>Nội dung quy định / thông báo</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={8}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Ví dụ: Ngày 30/11/2025, tòa nhà sẽ cắt điện từ 8h00 đến 14h00 để bảo trì..."
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
        </div>

        {/* Actions */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={handleSaveDraft}
            type="button"
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
            Lưu nháp
          </button>

          <button
            onClick={handleSend}
            type="button"
            disabled={isSending}
            style={{
              background: isSending ? "#9CA3AF" : "#0F3D8A",
              color: "#fff",
              padding: "8px 18px",
              border: "none",
              borderRadius: 8,
              cursor: isSending ? "default" : "pointer",
              fontWeight: 700,
              opacity: isSending ? 0.8 : 1,
            }}
          >
            {isSending ? "Đang gửi..." : "Gửi"}
          </button>

          <button
            onClick={handleCancel}
            type="button"
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
