// src/services/api/floorplan.js
import { http, unwrap as un } from "../http";

// Helper build error từ response
function buildFloorPlanError(res, defaultMsg) {
  const d = res?.data || {};
  const baseMsg = d.message || defaultMsg;

  const detail =
    Array.isArray(d.issues || d.errors) &&
    (d.issues || d.errors)
      .map((e) => e?.message || e?.msg || e?.reason || e?.code || "")
      .filter(Boolean)
      .join("\n");

  const err = new Error(detail ? baseMsg + "\n" + detail : baseMsg);
  err.response = res;
  return err;
}

/**
 * 🧱 Tạo floor plan mới.
 * Backend sẽ tự tăng version dựa trên (building_id, floor_number).
 */
export async function createFloorPlan(payload = {}) {
  const res = await http.post("/floor-plan", payload, {
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    throw buildFloorPlanError(res, "Không thể tạo floor plan");
  }

  // unwrap: trả về res.data.data || res.data || res
  return un(res);
}

/**
 * 📃 Lấy danh sách floor plan để dùng cho màn View.
 *
 * - FE có thể truyền { building_id, floor_number, page, limit, ... }
 * - Ở đây CHỈ forward các key an toàn (building_id, floor_number, is_published, version)
 *   -> KHÔNG gửi page / limit xuống backend, tránh lỗi Prisma do chuỗi.
 */
export async function listFloorPlans(filters = {}) {
  const {
    building_id,
    floor_number,
    is_published,
    version,
    // page, limit bị bỏ qua ở đây
  } = filters || {};

  const params = {};

  if (building_id !== undefined && building_id !== null && building_id !== "") {
    params.building_id = building_id;
  }
  if (
    floor_number !== undefined &&
    floor_number !== null &&
    floor_number !== ""
  ) {
    params.floor_number = floor_number;
  }
  if (is_published !== undefined && is_published !== null) {
    params.is_published = is_published;
  }
  if (version !== undefined && version !== null && version !== "") {
    params.version = version;
  }

  const res = await http.get("/floor-plan", {
    params,
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    throw buildFloorPlanError(res, "Không thể lấy danh sách floor plan");
  }

  const body = un(res);
  const items = Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body)
    ? body
    : [];

  return {
    items,
    pagination: body?.pagination ?? null,
  };
}

/**
 * 🔍 Lấy chi tiết 1 floor plan theo plan_id (có layout để vẽ).
 */
export async function getFloorPlanDetail(planId) {
  if (!planId) {
    throw new Error("planId is required");
  }

  const res = await http.get(`/floor-plan/${planId}`, {
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    throw buildFloorPlanError(res, "Không thể lấy chi tiết floor plan");
  }

  return un(res);
}

export async function updateFloorPlan(planId, payload = {}) {
  if (!planId) throw new Error("planId is required");

  const res = await http.put(`/floor-plan/${planId}`, payload, {
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    const msg = res?.data?.message || "Không thể cập nhật floor plan";
    throw new Error(msg);
  }

  return un(res);
}

export async function deleteFloorPlan(planId) {
  if (!planId) throw new Error("planId is required");

  const res = await http.delete(`/floor-plan/${planId}`, {
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    const msg = res?.data?.message || "Không thể xóa floor plan";
    throw new Error(msg);
  }

  return un(res);
}
