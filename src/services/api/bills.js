// src/services/api/bills.js
import { http, unwrap as un } from "../http";

/* ========== Helpers ========== */
// Trả về chuỗi ISO đầy đủ: YYYY-MM-DDTHH:mm:ss.sssZ
function toISOUTC(v) {
  if (!v) return undefined;
  const s = String(v).trim();

  // Đã là ISO có 'T' -> cố parse lại để normalize
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d1 = new Date(s);
    return Number.isNaN(d1.getTime()) ? undefined : d1.toISOString();
  }

  // 'YYYY-MM-DD' -> ép về UTC 00:00:00.000Z
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d2 = new Date(`${s}T00:00:00.000Z`);
    return Number.isNaN(d2.getTime()) ? undefined : d2.toISOString();
  }

  // Các dạng khác -> thử parse rồi normalize về ISO
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

// Số tiền: Number (2 chữ số thập phân)
function toAmount(v, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(n * 100) / 100;
}

function safeStr(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

// Gom lỗi từ nhiều kiểu payload khác nhau (zod/express-validator/joi…)
function extractServerError(res) {
  const d = res?.data;
  if (!d) return "Yêu cầu không hợp lệ";

  if (Array.isArray(d.issues)) {
    const lines = d.issues.map((it, i) => {
      const path =
        (Array.isArray(it?.path) && it.path.join(".")) ||
        it?.path ||
        it?.param ||
        it?.field ||
        String(i);
      const msg =
        it?.message ||
        it?.msg ||
        it?.reason ||
        it?.description ||
        it?.code ||
        it?.error;
      return `${path}: ${safeStr(msg)}`;
    });
    return (
      (d.message || "Validation error") +
      (lines.length ? "\n" + lines.join("\n") : "")
    );
  }

  if (Array.isArray(d.errors)) {
    const lines = d.errors.map((e) => {
      const path = e?.param || e?.path || e?.field || e?.key;
      const msg = e?.msg || e?.message || e?.error;
      return path ? `${path}: ${safeStr(msg)}` : safeStr(msg);
    });
    return (
      (d.message || "Validation error") +
      (lines.length ? "\n" + lines.join("\n") : "")
    );
  }

  if (d.errors && typeof d.errors === "object") {
    const lines = Object.entries(d.errors).map(
      ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : safeStr(v)}`
    );
    return (
      (d.message || "Validation error") +
      (lines.length ? "\n" + lines.join("\n") : "")
    );
  }

  if (Array.isArray(d.details)) {
    const lines = d.details.map((e) => {
      const path = Array.isArray(e?.path) ? e.path.join(".") : e?.path;
      return path ? `${path}: ${safeStr(e?.message)}` : safeStr(e?.message);
    });
    return (
      (d.message || "Validation error") +
      (lines.length ? "\n" + lines.join("\n") : "")
    );
  }

  return d.message || d.error || safeStr(d);
}

// Chuẩn hoá body gửi lên BE: ngày = ISO đầy đủ (UTC)
function buildBillPayload(form = {}) {
  const payload = {};

  // IDs
  if (form.roomId ?? form.room_id)
    payload.room_id = Number(form.roomId ?? form.room_id);
  if (form.tenantUserId ?? form.tenant_user_id)
    payload.tenant_user_id = Number(form.tenantUserId ?? form.tenant_user_id);

  // Dates (ép ISO UTC có 'T' + 'Z')
  if (form.billing_period_start)
    payload.billing_period_start = toISOUTC(form.billing_period_start);
  if (form.billing_period_end)
    payload.billing_period_end = toISOUTC(form.billing_period_end);
  if (form.due_date ?? form.dueDate)
    payload.due_date = toISOUTC(form.due_date ?? form.dueDate);

  // Text
  if (form.description !== undefined)
    payload.description = String(form.description ?? "");

  // Amounts (Number)
  if (form.penalty_amount ?? form.penaltyAmount !== undefined)
    payload.penalty_amount = toAmount(
      form.penalty_amount ?? form.penaltyAmount ?? 0
    );
  if (form.total_amount ?? form.totalAmount !== undefined)
    payload.total_amount = toAmount(form.total_amount ?? form.totalAmount ?? 0);

  return payload;
}

/* ========== A) LIST / DETAIL ========== */
export async function listBills() {
  const res = await http.get("/bill/all", { validateStatus: () => true });
  if (res?.status >= 400)
    throw new Error(res?.data?.message || "Không lấy được danh sách hóa đơn");
  const data = un(res);
  return Array.isArray(data) ? data : data?.items ?? [];
}
export async function listDraftBills() {
  const res = await http.get("/bill/draft", { validateStatus: () => true });
  if (res?.status >= 400)
    throw new Error(res?.data?.message || "Không lấy được danh sách nháp");
  const data = un(res);
  return Array.isArray(data) ? data : data?.items ?? [];
}
export async function listDeletedBills() {
  const res = await http.get("/bill/deleted", { validateStatus: () => true });
  if (res?.status >= 400)
    throw new Error(res?.data?.message || "Không lấy được danh sách đã xóa");
  const data = un(res);
  return Array.isArray(data) ? data : data?.items ?? [];
}
export async function getBillById(billId) {
  const id = Number(billId);
  const res = await http.get(`/bill/detail/${id}`, {
    validateStatus: () => true,
  });
  if (res?.status >= 400)
    throw new Error(res?.data?.message || "Không lấy được chi tiết hóa đơn");
  return un(res);
}

/* ========== B) CREATE ========== */
export async function createDraftBill(form = {}) {
  const payload = buildBillPayload(form);
  // eslint-disable-next-line no-console
  console.debug("[Bill][createDraft] payload =>", payload);
  const res = await http.post("/bill/create/draft", payload, {
    validateStatus: () => true,
  });
  if (res?.status >= 400) {
    // eslint-disable-next-line no-console
    console.debug("[Bill][createDraft] response error =>", res?.data);
    throw new Error(extractServerError(res));
  }
  return un(res);
}
export async function createIssuedBill(form = {}) {
  const payload = buildBillPayload(form);
  // eslint-disable-next-line no-console
  console.debug("[Bill][createIssued] payload =>", payload);
  const res = await http.post("/bill/create/issue", payload, {
    validateStatus: () => true,
  });
  if (res?.status === 409)
    throw new Error(res?.data?.message || "Phòng đã có hóa đơn cho kỳ này");
  if (res?.status >= 400) {
    // eslint-disable-next-line no-console
    console.debug("[Bill][createIssued] response error =>", res?.data);
    throw new Error(extractServerError(res));
  }
  return un(res);
}

/* ========== C) UPDATE ========== */
export async function updateDraftBill(billId, form = {}) {
  const id = Number(billId);
  const payload = buildBillPayload(form);
  const res = await http.put(`/bill/edit/draft/${id}`, payload, {
    validateStatus: () => true,
  });
  if (res?.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}
export async function updateIssuedBill(billId, form = {}) {
  const id = Number(billId);
  const payload = buildBillPayload(form);
  const res = await http.put(`/bill/edit/issue/${id}`, payload, {
    validateStatus: () => true,
  });
  if (res?.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

/* ========== D) DELETE / RESTORE ========== */
export async function deleteOrCancelBill(billId) {
  const id = Number(billId);
  const res = await http.delete(`/bill/delete/${id}`, {
    validateStatus: () => true,
  });
  if (res?.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}
export async function restoreBill(billId) {
  const id = Number(billId);
  const res = await http.post(`/bill/restore/${id}`, null, {
    validateStatus: () => true,
  });
  if (res?.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

/* ========== E) PRE-CHECK ========== */
// Endpoint này đang yêu cầu 'YYYY-MM-DD' theo controller → query vẫn giữ date-only
export async function getUnbilledRooms(periodStart) {
  const s = String(periodStart || "").slice(0, 10);
  const res = await http.get("/bill/unbilled-rooms", {
    params: { period_start: s },
    validateStatus: () => true,
  });
  if (res?.status >= 400) throw new Error(extractServerError(res));
  const data = un(res);
  return Array.isArray(data) ? data : data?.items ?? [];
}
export async function precheckDuplicateBill(roomId, periodStart) {
  const rooms = await getUnbilledRooms(periodStart);
  const id = String(roomId);
  return rooms.some((r) => String(r?.room_id ?? r?.id) === id);
}
