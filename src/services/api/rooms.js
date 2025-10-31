// src/services/api/rooms.js
import { http } from "../http";

const un = (res) => res?.data?.data ?? res?.data ?? res;

// Thử nhiều endpoint để hợp với BE hiện có
const ROOM_ENDPOINTS = [
  { url: "/room/list", params: { status: "active", take: 200 } },
  { url: "/room", params: { status: "active" } },
  { url: "/rooms", params: { status: "active" } },
];

function normalizeRoom(r) {
  const id = r?.room_id ?? r?.id ?? r?.roomId ?? r?.room?.id;
  const label =
    r?.room_number ??
    r?.number ??
    r?.name ??
    r?.room?.room_number ??
    (id != null ? `Phòng ${id}` : "Phòng");
  const floor = r?.floor ?? r?.level ?? r?.room?.floor ?? null;
  return id == null ? null : { id, label, floor };
}

/** Lấy danh sách phòng rút gọn cho dropdown */
export async function listRoomsLite() {
  for (const ep of ROOM_ENDPOINTS) {
    try {
      const res = await http.get(ep.url, {
        params: ep.params,
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) {
        const raw = un(res);
        const arr = raw?.items ?? raw?.data ?? raw;
        const items = (Array.isArray(arr) ? arr : [])
          .map(normalizeRoom)
          .filter(Boolean);
        return items; // trả về luôn mảng (có thể rỗng)
      }
    } catch {
      // thử endpoint tiếp theo
    }
  }
  return [];
}
