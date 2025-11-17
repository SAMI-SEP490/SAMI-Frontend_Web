// src/services/api/floorplan.js
import { http, unwrap as un } from "../http";

/**
 * Tạo floor plan mới.
 * Backend sẽ tự tăng version dựa trên (building_id, floor_number).
 */
export async function createFloorPlan(payload = {}) {
  const res = await http.post("/floor-plan", payload, {
    // Tự xử lý status thay vì để axios throw
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    const d = res.data || {};
    const baseMsg = d.message || "Không thể tạo floor plan";

    // Gom thêm chi tiết lỗi nếu có
    const detail =
      Array.isArray(d.issues || d.errors) &&
      (d.issues || d.errors)
        .map((e) => e?.message || e?.msg || e?.reason || e?.code || "")
        .filter(Boolean)
        .join("\n");

    const err = new Error(detail ? baseMsg + "\n" + detail : baseMsg);
    err.response = res;
    throw err;
  }

  return un(res);
}
