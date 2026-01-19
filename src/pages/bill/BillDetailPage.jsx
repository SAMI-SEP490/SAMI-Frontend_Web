import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, Pencil, Send, Trash, XCircle } from "react-bootstrap-icons"; // Thêm XCircle
import {
  getBillById,
  updateDraftBill,
  deleteOrCancelBill,
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
  if (status === "cancelled") return <span className="status cancelled">Đã hủy</span>; // Thêm style cancelled nếu cần
  return <span className="status published">Đã xuất bản</span>;
}

function renderPaymentStatus(status) {
  if (status === "paid") return <span className="status paid">Đã thanh toán</span>;
  if (status === "partially_paid") return <span className="status partial">Thanh toán một phần</span>;
  if (status === "overdue") return <span className="status overdue">Quá hạn</span>;
  if (status === "cancelled") return null; // Không hiện payment status nếu đã hủy
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

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!bill) return null;

  const status = getBillStatus(bill);
  const published = isPublished(status);
  const isCancellable = ["issued", "overdue", "partially_paid"].includes(status);

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

            {/* Paid Row */}
            {Number(bill.paid_amount) > 0 && (
              <tr className="table-success">
                <td colSpan={3} className="text-end fw-bold text-success">Đã thanh toán:</td>
                <td className="text-end fw-bold text-success">
                  - {Number(bill.paid_amount).toLocaleString()} đ
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
      </div>
    </div>
  );
}
