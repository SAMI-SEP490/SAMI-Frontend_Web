// src/pages/notification/EditNotificationPage.jsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { colors } from "../../constants/colors";
import { sendBroadcastNotification } from "../../services/api/notification";
import { ROUTES } from "../../constants/routes";

export default function EditNotificationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Dữ liệu thông báo được truyền qua location.state (nếu có)
  const initialNotification = location.state?.notification || null;

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    building: "",
    effectiveDate: "",
    expiryDate: "",
    content: "",
  });

  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (initialNotification) {
      setFormData({
        title: initialNotification.title || "",
        category: initialNotification.category || "",
        building: initialNotification.building || "",
        effectiveDate: initialNotification.effectiveDate || "",
        expiryDate: initialNotification.expiryDate || "",
        content: initialNotification.content || "",
      });
    }
  }, [initialNotification]);

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #CBD5E1",
    fontSize: 14,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate(ROUTES.notifications);
  };

  const handleSend = async () => {
    if (!formData.title || !formData.content) {
      alert("Vui lòng nhập tối thiểu Tiêu đề và Nội dung.");
      return;
    }

    const payload = {
      category: formData.category || "",
      effectiveDate: formData.effectiveDate || "",
      expiryDate: formData.expiryDate || "",
      content: formData.content || "",
      building: formData.building || "",
      type: "REGULATION",
      originalId: id, // chỉ để tham khảo nếu sau này cần
    };

    try {
      setIsSending(true);
      await sendBroadcastNotification({
        title: formData.title,
        body: formData.content,
        payload,
      });

      alert("Đã gửi lại thông báo cho cư dân trên app.");
      navigate(ROUTES.notifications);
    } catch (error) {
      console.error("Failed to resend notification:", error);
      alert("Gửi thông báo thất bại. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  if (!initialNotification) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.background,
          padding: 24,
        }}
      >
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>
          Không tìm thấy thông báo
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          Trang chỉnh sửa này yêu cầu bạn điều hướng từ danh sách và truyền dữ
          liệu thông báo qua <code>location.state</code>.
        </p>
        <button
          onClick={() => navigate(ROUTES.notifications)}
          style={{
            marginTop: 12,
            background: "#0F3D8A",
            color: "#fff",
            padding: "8px 18px",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: 24,
      }}
    >
      <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
        Chỉnh sửa & gửi lại thông báo
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
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 600 }}>Tiêu đề</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
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

        <div style={{ marginBottom: 12 }}>
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

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 600 }}>Nội dung</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={8}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            type="button"
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
            type="button"
            onClick={handleSend}
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
            {isSending ? "Đang gửi..." : "Gửi lại"}
          </button>
        </div>
      </form>
    </div>
  );
}
