// src/services/api/rooms.js
import { http, unwrap } from "../http";

/**
 * Gọi /api/room và chỉ map ra meta cần cho dropdown
 * Trả về: [{ id, label }] trong đó label = số phòng.
 */
async function _callRoomsList() {
  try {
    const res = await http.get("/room", { validateStatus: () => true });

    if (res.status >= 200 && res.status < 300) {
      const payload = res?.data?.data ?? res?.data ?? [];
      const arr = Array.isArray(payload) ? payload : payload?.items ?? [];

      return (Array.isArray(arr) ? arr : [])
          .map((r) => {
            const id = r?.id ?? r?.room_id ?? r?.roomId;
            const number = r?.room_number ?? r?.number ?? r?.name ?? `${id}`;
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

/** Lấy danh sách phòng dạng lite cho dropdown */
export async function listRoomsLite() {
  return _callRoomsList();
}

/** Lấy danh sách phòng dạng lite (tên "safe") */
export async function listRoomsLiteSafe() {
  return _callRoomsList();
}

/** Lấy danh sách tất cả các phòng (owner, manager) */
export async function listRooms() {
  try {
    const response = await http.get("/room");
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng:", error);
    throw error;
  }
}

/** Lấy thông tin phòng theo ID */
export async function getRoomById(id) {
  try {
    const response = await http.get(`/room/${id}`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi lấy phòng ${id}:`, error);
    throw error;
  }
}

/** Lấy phòng của user theo userID */
export async function getRoomsByUserId(userId) {
  try {
    const response = await http.get(`/room/user/${userId}`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi lấy phòng của user ${userId}:`, error);
    throw error;
  }
}

/** Lấy thống kê phòng theo building */
export async function getRoomStatisticsByBuilding(buildingId) {
  try {
    const response = await http.get(`/room/statistics/building/${buildingId}`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi lấy thống kê phòng của building ${buildingId}:`, error);
    throw error;
  }
}

/** Tạo phòng mới */
export async function createRoom(roomData) {
  try {
    const response = await http.post("/room", roomData);
    return unwrap(response);
  } catch (error) {
    console.error("Lỗi khi tạo phòng:", error);
    throw error;
  }
}

/** Cập nhật phòng */
export async function updateRoom(id, roomData) {
  try {
    const response = await http.put(`/room/${id}`, roomData);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi cập nhật phòng ${id}:`, error);
    throw error;
  }
}

/** Vô hiệu hóa phòng */
export async function deactivateRoom(id) {
  try {
    const response = await http.post(`/room/${id}/deactivate`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi vô hiệu hóa phòng ${id}:`, error);
    throw error;
  }
}

/** Kích hoạt lại phòng */
export async function activateRoom(id) {
  try {
    const response = await http.post(`/room/${id}/activate`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi kích hoạt phòng ${id}:`, error);
    throw error;
  }
}

/** Xóa vĩnh viễn phòng */
export async function hardDeleteRoom(id) {
  try {
    const response = await http.delete(`/room/${id}/permanent`);
    return unwrap(response);
  } catch (error) {
    console.error(`Lỗi khi xóa phòng ${id}:`, error);
    throw error;
  }
}
