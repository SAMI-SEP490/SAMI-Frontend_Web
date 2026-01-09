// src/services/api/bills.js
import { http, unwrap as un } from "../http";

/* ========== Helpers: Data Formatting ========== */
function toISOUTC(v) {
  if (!v) return undefined;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return new Date(s).toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00.000Z`).toISOString();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function toAmount(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeStr(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  try { return JSON.stringify(x); } catch { return String(x); }
}

/* ========== Helpers: Error Extraction ========== */
// Extracts readable error messages from Backend (Zod, Prisma, or Logic)
function extractServerError(res) {
  if (!res) return "Lỗi kết nối máy chủ";
  const d = res.data;
  if (!d) return res.statusText || "Lỗi không xác định";

  // 1. Zod Middleware Errors (Array of objects)
  if (Array.isArray(d.errors)) {
    return d.errors.map((e) => {
      const msg = e.message || e.msg;
      return e.field ? `${e.field}: ${msg}` : msg;
    }).join("\n");
  }

  // 2. Logic Errors (e.g. "Bill overlap")
  if (d.message) return d.message;

  // 3. Fallback
  if (typeof d === "string") return d;
  return "Yêu cầu không hợp lệ";
}

/* ========== Helpers: Payload Builder ========== */
function buildBillPayload(form = {}) {
  const payload = {};

  // IDs
  if (form.contractId ?? form.contract_id)
    payload.contract_id = Number(form.contractId ?? form.contract_id);

  if (form.tenantUserId ?? form.tenant_user_id)
    payload.tenant_user_id = Number(form.tenantUserId ?? form.tenant_user_id);

  if (form.billType ?? form.bill_type)
    payload.bill_type = String(form.billType ?? form.bill_type);

  // Dates
  if (form.billing_period_start) payload.billing_period_start = toISOUTC(form.billing_period_start);
  if (form.billing_period_end) payload.billing_period_end = toISOUTC(form.billing_period_end);
  if (form.due_date) payload.due_date = toISOUTC(form.due_date);

  // Text
  if (form.description) payload.description = String(form.description);

  // Amounts
  if (form.penalty_amount !== undefined) payload.penalty_amount = toAmount(form.penalty_amount);
  if (form.total_amount !== undefined) payload.total_amount = toAmount(form.total_amount);

  // Service Charges
  if (Array.isArray(form.service_charges)) {
    payload.service_charges = form.service_charges.map(c => ({
      service_type: String(c.service_type || "Other"),
      amount: toAmount(c.amount),
      quantity: toAmount(c.quantity || 1),
      unit_price: toAmount(c.unit_price || c.amount),
      description: c.description || ""
    }));
  }

  // Status
  if (form.status) payload.status = String(form.status);

  return payload;
}

/* ========== API Calls ========== */

export async function listBills(params = {}) {
  const res = await http.get("/bill/all", { params, validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

export async function listDraftBills() {
  const res = await http.get("/bill/draft", { validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

export async function getBillById(id) {
  const res = await http.get(`/bill/detail/${id}`, { validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

export async function createDraftBill(form) {
  const payload = buildBillPayload(form);
  const res = await http.post("/bill/create/draft", payload, { validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

export async function createIssuedBill(form) {
  const payload = buildBillPayload(form);
  const res = await http.post("/bill/create/issue", payload, { validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

export async function updateDraftBill(id, form) {
  const payload = buildBillPayload(form);
  const res = await http.put(`/bill/edit/draft/${id}`, payload, { validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

export async function updateIssuedBill(id, form) {
  const payload = buildBillPayload(form);
  const res = await http.put(`/bill/edit/issue/${id}`, payload, { validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

export async function deleteOrCancelBill(id) {
  const res = await http.delete(`/bill/delete/${id}`, { validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

export async function restoreBill(id) {
  const res = await http.post(`/bill/restore/${id}`, null, { validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

// Cash Payment
export async function createCashPayment(billId) {
  const res = await http.post("/payments/cash", { bill_ids: [Number(billId)] }, { validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

// Pre-check
export async function getUnbilledRooms(periodStart) {
  const s = toISOUTC(periodStart)?.slice(0, 10);
  const res = await http.get("/bill/unbilled-rooms", { params: { period_start: s }, validateStatus: () => true });
  if (res.status >= 400) throw new Error(extractServerError(res));
  return un(res);
}

export async function precheckDuplicateBill(roomId, periodStart) {
  // This function is purely logic on top of getUnbilledRooms, no HTTP call itself
  // But we need to handle potential errors from getUnbilledRooms
  try {
    const rooms = await getUnbilledRooms(periodStart);
    const id = String(roomId);
    // Logic: getUnbilledRooms returns rooms that DO NOT have a bill.
    // So if the room is IN the list, it is safe (not duplicate).
    // If the room is NOT in the list, it means it IS billed (duplicate exists).

    const isSafe = rooms.some((r) => String(r?.room_id ?? r?.id) === id);
    return isSafe; // true = safe to create, false = duplicate exists
  } catch (e) {
    console.warn("Precheck failed:", e);
    return true; // Fail open (allow creation, let backend validate)
  }
}
