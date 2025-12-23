// src/services/api/notification.js
// Gọi API thông báo từ backend để gửi thông báo cho tenant (đọc trên app)

import { http, unwrap } from "../http";

/**
 * 🔔 Gửi broadcast tới TẤT CẢ tenant
 * Backend: POST /api/notifications/broadcast
 * (http đã có baseURL = "/api" nên ở đây chỉ cần "/notifications/broadcast")
 */
export async function sendBroadcastNotification({ title, body, payload = {} }) {
  const { data } = await http.post("/notifications/broadcast", {
    title,
    body,
    payload,
  });
  return unwrap(data);
}

/**
 * 📩 Lấy danh sách thông báo đã gửi (Outbox)
 * Backend: GET /api/notifications/sent
 */
export async function getSentNotifications() {
  const { data } = await http.get("/notifications/sent");
  return unwrap(data);
}
