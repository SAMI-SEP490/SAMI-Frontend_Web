import { http } from "../http";

/** -----------------------------
 * UTILITY READINGS (ELECTRIC / WATER)
 * ----------------------------- */

/**
 * 1️⃣ Lấy chỉ số tháng trước để fill form nhập
 * GET /api/utility/readings
 *
 * params:
 * - building_id
 * - month
 * - year
 */
export async function getUtilityReadingsForm(params = {}) {
  try {
    const res = await http.get("/utility/readings", { params });
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu chỉ số tháng trước:", error);
    throw error;
  }
}

/**
 * 2️⃣ Submit chỉ số tháng hiện tại (bulk upsert)
 * POST /api/utility/readings
 */
export async function submitUtilityReadings(payload) {
  try {
    const res = await http.post("/utility/readings", payload);
    return res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    console.error("Lỗi khi submit chỉ số tiện ích:", error);
    throw error;
  }
}

/**
 * 3️⃣ Lấy lịch sử chỉ số (ALL previous readings)
 * GET /api/utility/readings/history
 *
 * params:
 * - building_id
 * - month (optional)
 * - year (optional)
 */
export async function getUtilityReadingsHistory(params = {}) {
  try {
    const res = await http.get("/utility/readings/history", { params });
    return res?.data?.data ?? res?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử chỉ số tiện ích:", error);
    throw error;
  }
}
