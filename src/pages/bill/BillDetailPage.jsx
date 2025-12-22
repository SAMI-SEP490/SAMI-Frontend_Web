import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, Pencil, Send, Trash } from "react-bootstrap-icons";
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

  return <span className="status published">Đã xuất bản</span>;
}

function renderPaymentStatus(status) {
  if (status === "paid")
    return <span className="status paid">Đã thanh toán</span>;

  if (status === "partially_paid")
    return <span className="status partial">Thanh toán một phần</span>;

  if (status === "overdue")
    return <span className="status overdue">Quá hạn</span>;

  return <span className="status unpaid">Chưa thanh toán</span>;
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

    await updateDraftBill(id, { status: "issued" });
    alert("Xuất bản hóa đơn thành công.");

    setBill({ ...bill, status: "issued" });
  }

  async function onDelete() {
    if (!bill) return;
    if (!window.confirm("Xóa hóa đơn nháp này?")) return;

    await deleteOrCancelBill(id);
    navigate("/bills");
  }

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!bill) return null;

  const status = getBillStatus(bill);
  const published = isPublished(status);

  return (
    <div className="container">
      <h2 className="title">Chi tiết hóa đơn</h2>

      {/* STATUS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {renderPublishStatus(status)}
        {published && renderPaymentStatus(status)}
      </div>

      {/* INFO */}
      <div className="card">
        <p>
          <b>Tên hóa đơn:</b> {bill.description || "—"}
        </p>
        <p>
          <b>Phòng:</b> {bill.room?.room_number || bill.room_id}
        </p>
        <p>
          <b>Tổng tiền:</b> {bill.total_amount?.toLocaleString()} đ
        </p>
        <p>
          <b>Thời gian:</b> {bill.billing_period_start} →{" "}
          {bill.billing_period_end}
        </p>
      </div>

      {/* ACTION */}
      <div className="action-buttons" style={{ marginTop: 20 }}>
        <button className="btn view" onClick={() => navigate("/bills")}>
          <Eye size={14} /> Quay lại
        </button>

        {status === "draft" && (
          <>
            <button
              className="btn edit"
              onClick={() => navigate(`/bills/edit/${id}`)}
            >
              <Pencil size={14} /> Sửa
            </button>

            <button className="btn publish" onClick={onPublish}>
              <Send size={14} /> Xuất bản
            </button>

            <button className="btn delete" onClick={onDelete}>
              <Trash size={14} /> Xóa
            </button>
          </>
        )}
      </div>
    </div>
  );
}
