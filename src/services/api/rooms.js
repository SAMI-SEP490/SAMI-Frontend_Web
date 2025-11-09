// src/services/api/rooms.js
import { http,unwrap } from "../http";

/**
 * Gọi /api/room và chỉ map ra meta cần cho dropdown
 * Trả về: [{ id, label }] trong đó label = số phòng.
 * Không gửi status/limit để tránh backend validate sai.
 */
async function _callRoomsList() {
  try {
    const res = await http.get("/room", { validateStatus: () => true });

    if (res.status >= 200 && res.status < 300) {
      const payload = res?.data?.data ?? res?.data ?? [];
      const arr = Array.isArray(payload) ? payload : payload?.items ?? [];

      return (Array.isArray(arr) ? arr : [])
        .map((r) => {
          const id =
            r?.room_id ?? r?.id ?? r?.roomId ?? r?.room?.room_id ?? r?.room?.id;
          const number =
            r?.room_number ??
            r?.number ??
            r?.name ??
            r?.room?.room_number ??
            (id != null ? `${id}` : "");
          return id == null || !number
            ? null
            : { id: String(id), label: String(number) };
        })
        .filter(Boolean);
    }

    return [];
  } catch {
    return [];
  }
}

/** Tên cũ nhiều nơi đang dùng — giữ nguyên để tương thích */
export async function listRoomsLite() {
  return _callRoomsList();
}

/** Tên “safe” mới — bạn có thể dùng ở chỗ khác nếu muốn */
export async function listRoomsLiteSafe() {
  return _callRoomsList();
}

/**
 * Lấy danh sách tất cả các phòng
 * Yêu cầu quyền: owner, manager
 */
export async function listRooms() {
  try {
    const response = await http.get("/room");
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng:", error);
    throw error;
  }
}
