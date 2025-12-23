import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../constants/colors";
import { ROUTES } from "../../constants/routes";
import { getSentNotifications } from "../../services/api/notification";

export default function NotificationListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getSentNotifications();

      // Handle response structure depending on unwrap implementation
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Không thể tải danh sách thông báo.");
    } finally {
      setLoading(false);
    }
  };

  const goToCreate = () => {
    navigate(ROUTES.createNotification);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: 24,
      }}
    >
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ fontWeight: 700, marginBottom: 4 }}>
            Quản lý thông báo / quy định
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
            Lịch sử các thông báo đã gửi tới cư dân.
          </p>
        </div>

        <button
          type="button"
          onClick={goToCreate}
          style={{
            background: "#0F3D8A",
            color: "#fff",
            padding: "8px 18px",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Tạo thông báo mới
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 20,
          borderRadius: 10,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
        }}
      >
        {loading ? (
          <p style={{ color: "#6B7280", textAlign: "center" }}>
            Đang tải dữ liệu...
          </p>
        ) : error ? (
          <p style={{ color: "red", textAlign: "center" }}>{error}</p>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#6B7280" }}>
            <p>Chưa có thông báo nào được gửi.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid #E5E7EB", textAlign: "left" }}
              >
                <th style={{ padding: "12px 8px", color: "#374151" }}>
                  Thời gian gửi
                </th>
                <th style={{ padding: "12px 8px", color: "#374151" }}>
                  Tiêu đề
                </th>
                <th style={{ padding: "12px 8px", color: "#374151" }}>
                  Nội dung
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    color: "#374151",
                    textAlign: "center",
                  }}
                >
                  Số người nhận
                </th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notif) => (
                <tr
                  key={notif.notification_id}
                  style={{ borderBottom: "1px solid #F3F4F6" }}
                >
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: 14,
                      color: "#4B5563",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(notif.created_at)}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {notif.title}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: 14,
                      color: "#4B5563",
                      maxWidth: "400px",
                    }}
                  >
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {notif.body}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      fontSize: 14,
                      color: "#4B5563",
                      textAlign: "center",
                    }}
                  >
                    {notif.recipient_count ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
