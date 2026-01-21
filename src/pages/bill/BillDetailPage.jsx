import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, Pencil, Send, Trash, XCircle, CashStack, CreditCard, ClockHistory } from "react-bootstrap-icons";
import {
  getBillById,
  updateDraftBill,
  deleteOrCancelBill,
  extendBill,
  getPenaltyCalculation
} from "../../services/api/bills";
import "./BillListPage.css";

/* ================= Helpers ================= */
function getBillStatus(bill) {
  return String(bill?.status || bill?.bill_status || "").toLowerCase();
}

function isPublished(status) {
  return status !== "draft";
}

function renderPublishStatus(status) {
  if (status === "draft") return <span className="status draft">Nháp</span>;
  if (status === "cancelled") return <span className="status cancelled">Đã hủy</span>;
  return <span className="status published">Đã xuất bản</span>;
}

function renderPaymentStatus(status) {
  if (status === "paid") return <span className="status paid">Đã thanh toán</span>;
  if (status === "partially_paid") return <span className="status partial">Thanh toán một phần</span>;
  if (status === "overdue") return <span className="status overdue">Quá hạn</span>;
  if (status === "cancelled") return null;
  return <span className="status unpaid">Chưa thanh toán</span>;
}

// Find room number from nested contract data
function getRoomLabel(bill) {
  if (bill.room?.room_number) return bill.room.room_number;
  const contract = bill.contract;
  if (!contract) return "—";
  const room = contract.room_current || contract.room_history;
  return room?.room_number || "—";
}

// Auto-generate title if description is missing
function getBillTitle(bill) {
  if (bill.description && bill.description.trim() !== "") {
    return bill.description;
  }
  // Fallback: "Hóa đơn tháng X/YYYY"
  if (bill.billing_period_start) {
    const d = new Date(bill.billing_period_start);
    return `Hóa đơn tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
  }
  return "Hóa đơn";
}

// Helper format tiền tệ
const fmtMoney = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

// Helper format ngày giờ
const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString('vi-VN');
}

/* ================= Page ================= */
export default function BillDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getBillById(id);
        setBill(data);
      } catch {
        setError("Không tải được chi tiết hóa đơn.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onPublish() {
    if (!bill) return;
    const ok = window.confirm(
      "Bạn có chắc muốn xuất bản hóa đơn này?\nSau khi xuất bản sẽ KHÔNG thể chỉnh sửa hoặc hoàn tác."
    );
    if (!ok) return;

    try {
      await updateDraftBill(id, { status: "issued" });
      alert("Xuất bản hóa đơn thành công.");

      const updated = await getBillById(id);
      setBill(updated);
    } catch (e) {
      alert(e.message || "Lỗi khi xuất bản hóa đơn");
    }
  }

  // Xóa nháp (Chỉ dành cho Draft)
  async function onDelete() {
    if (!bill) return;
    if (!window.confirm("Xóa hóa đơn nháp này? Hành động này không thể hoàn tác.")) return;

    try {
      await deleteOrCancelBill(id);
      navigate("/bills");
    } catch (e) {
      alert(e.message || "Lỗi khi xóa hóa đơn");
    }
  }

  // Hủy hóa đơn (Dành cho Issued / Overdue)
  async function onCancel() {
    if (!bill) return;
    const ok = window.confirm(
      "Bạn có chắc chắn muốn HỦY hóa đơn này?\n\nHóa đơn sẽ chuyển sang trạng thái 'Đã hủy' và không thể thanh toán được nữa."
    );
    if (!ok) return;

    try {
      await deleteOrCancelBill(id);
      alert("Đã hủy hóa đơn thành công.");

      // Reload lại data để cập nhật UI
      const updated = await getBillById(id);
      setBill(updated);
    } catch (e) {
      alert(e.message || "Lỗi khi hủy hóa đơn");
    }
  }

  // Logic Gia hạn với gợi ý tiền phạt
  async function onExtend() {
    if (!bill) return;

    let suggestedPenalty = 0;
    let promptMsg = "Gia hạn thêm 5 ngày.\nNhập số tiền phạt (VNĐ):";

    // Nếu là tiền nhà, gọi API lấy số tiền phạt gợi ý
    if (bill.bill_type === 'monthly_rent') {
      try {
        const calc = await getPenaltyCalculation(bill.bill_id);
        if (calc && calc.penalty_rate_percent > 0) {
          suggestedPenalty = calc.calculated_penalty;
          promptMsg = `Gia hạn thêm 5 ngày.\n\nHệ thống tính phạt ${calc.penalty_rate_percent}% theo hợp đồng:\n= ${fmtMoney(calc.calculated_penalty)}\n\nNhập số tiền phạt thực tế (VNĐ):`;
        }
      } catch (e) {
        console.warn("Cannot calc penalty", e);
      }
    }

    const input = window.prompt(promptMsg, Math.round(suggestedPenalty));
    if (input === null) return;

    const penalty = Number(input);
    if (isNaN(penalty) || penalty < 0) return alert("Số tiền không hợp lệ");

    try {
      await extendBill(bill.bill_id, penalty);
      alert("✅ Đã gia hạn thành công!");
      loadData();
    } catch (e) {
      alert(e.message || "Lỗi gia hạn");
    }
  }

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!bill) return null;

  const status = getBillStatus(bill);
  const published = isPublished(status);
  const isCancellable = ["issued", "overdue", "partially_paid"].includes(status);

  // [UPDATE] Chỉ hiện payments nếu có dữ liệu VÀ trạng thái là paid/partially_paid
  const payments = bill.payment_details?.map(d => d.payment) || [];
  
  // Logic hiển thị: Có payment history và trạng thái phải là đã/đang thanh toán
  const showPaymentHistory = payments.length > 0 && (status === 'paid' || status === 'partially_paid');

  return (
    <div className="container">
      <h2 className="title">Chi tiết hóa đơn</h2>

      {/* HEADER: STATUS & ID */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <h4 className="m-0 text-primary">#{bill.bill_number}</h4>
        {renderPublishStatus(status)}
        {published && renderPaymentStatus(status)}
      </div>

      {/* INFO CARD */}
      <div className="card mb-4 p-3 shadow-sm border-0">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="text-muted small">Tên hóa đơn / Mô tả</label>
            <div className="fw-bold fs-5">{getBillTitle(bill)}</div>
          </div>

          <div className="col-md-3">
            <label className="text-muted small">Phòng</label>
            <div className="fw-bold">{getRoomLabel(bill)}</div>
          </div>

          <div className="col-md-3">
            <label className="text-muted small">Khách thuê</label>
            <div className="fw-bold">{bill.tenant?.user?.full_name || `User ID: ${bill.tenant_user_id}`}</div>
          </div>

          <div className="col-md-6">
            <label className="text-muted small">Kỳ thanh toán</label>
            <div>
              {new Date(bill.billing_period_start).toLocaleDateString('vi-VN')}
              <span className="mx-2">➔</span>
              {new Date(bill.billing_period_end).toLocaleDateString('vi-VN')}
            </div>
          </div>

          <div className="col-md-6">
            <label className="text-muted small">Hạn thanh toán (Due Date)</label>
            <div className={status === 'overdue' ? 'text-danger fw-bold' : ''}>
              {new Date(bill.due_date).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      {/* [NEW] PAYMENT HISTORY CARD - Chỉ hiện khi đã thanh toán */}
      {showPaymentHistory && (
        <div className="card mb-4 p-3 shadow-sm border-success border-2">
          <h5 className="text-success d-flex align-items-center gap-2">
            <CashStack /> Lịch sử thanh toán
          </h5>
          <div className="table-responsive">
            <table className="table table-sm table-borderless mb-0">
              <thead className="text-muted small border-bottom">
                <tr>
                  <th>Ngày giờ</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Mã giao dịch</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.payment_id}>
                    <td>{fmtDateTime(p.payment_date)}</td>
                    <td className="fw-bold text-success">+{fmtMoney(p.amount)}</td>
                    <td>
                      {p.method === 'online' ? (
                        <span className="badge bg-info text-dark"><CreditCard className="me-1" /> Online ({p.online_type})</span>
                      ) : (
                        <span className="badge bg-secondary"><CashStack className="me-1" /> Tiền mặt</span>
                      )}
                    </td>
                    <td className="font-monospace small">{p.transaction_id || p.reference || "—"}</td>
                    <td className="small text-muted">{p.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SERVICE CHARGES TABLE */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <h5 className="m-0">Chi tiết phí dịch vụ</h5>
        </div>
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: '40%' }}>Khoản mục</th>
              <th className="text-center" style={{ width: '15%' }}>SL</th>
              <th className="text-end" style={{ width: '20%' }}>Đơn giá</th>
              <th className="text-end" style={{ width: '25%' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {bill.service_charges?.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <div className="fw-medium">{item.service_type}</div>
                  {item.description && (
                    <div className="text-muted small fst-italic mt-1">
                      <i className="bi bi-info-circle me-1"></i>
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="text-center align-middle">{item.quantity}</td>
                <td className="text-end align-middle">{Number(item.unit_price || item.amount).toLocaleString()}</td>
                <td className="text-end align-middle fw-bold">{Number(item.amount).toLocaleString()}</td>
              </tr>
            ))}
            {(!bill.service_charges || bill.service_charges.length === 0) && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-muted">
                  Không có chi tiết (Hóa đơn cũ hoặc chưa cập nhật)
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            {/* Penalty Row */}
            {Number(bill.penalty_amount) > 0 && (
              <tr>
                <td colSpan={3} className="text-end text-danger">Phạt quá hạn:</td>
                <td className="text-end text-danger fw-bold">
                  + {Number(bill.penalty_amount).toLocaleString()} đ
                </td>
              </tr>
            )}

            {/* Total Row */}
            <tr className="table-primary">
              <td colSpan={3} className="text-end fw-bold fs-6 pt-3">TỔNG CỘNG:</td>
              <td className="text-end fw-bold text-primary fs-5 pt-3">
                {(Number(bill.total_amount) + Number(bill.penalty_amount || 0)).toLocaleString()} đ
              </td>
            </tr>

            {/* Paid Row - Chỉ hiện khi có tiền đã đóng */}
            {Number(bill.paid_amount) > 0 && (
              <tr className="table-success">
                <td colSpan={3} className="text-end fw-bold text-success">Đã thanh toán:</td>
                <td className="text-end fw-bold text-success">
                  {Number(bill.paid_amount).toLocaleString()} đ
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* ACTION BUTTONS */}
      <div className="action-buttons d-flex gap-2 mt-4 justify-content-end">
        <button className="btn btn-secondary" onClick={() => navigate("/bills")}>
          <Eye size={14} className="me-2" /> Quay lại
        </button>

        {/* NÚT CHO TRẠNG THÁI NHÁP */}
        {status === "draft" && (
          <>
            <button className="btn btn-warning text-white" onClick={() => navigate(`/bills/${id}/edit`)}>
              <Pencil size={14} className="me-2" /> Sửa
            </button>

            <button className="btn btn-primary" onClick={onPublish}>
              <Send size={14} className="me-2" /> Xuất bản
            </button>

            <button className="btn btn-danger" onClick={onDelete}>
              <Trash size={14} className="me-2" /> Xóa
            </button>
          </>
        )}

        {/* NÚT CHO TRẠNG THÁI ĐÃ XUẤT BẢN (CÓ THỂ HỦY) */}
        {isCancellable && (
          <button className="btn btn-outline-danger" onClick={onCancel}>
            <XCircle size={14} className="me-2" /> Hủy bỏ
          </button>
        )}
        {status === 'overdue' && (
          <button className="btn btn-info text-white" onClick={onExtend}>
            <ClockHistory size={14} className="me-2" /> Gia hạn
          </button>
        )}
      </div>
    </div>
  );
}
