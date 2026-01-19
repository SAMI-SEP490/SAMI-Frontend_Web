import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash, Plus, ArrowLeft, Save, Pencil, Lock } from "react-bootstrap-icons";
import { getBillById, updateDraftBill } from "../../services/api/bills";

/* ================== Helpers ================== */
function parseDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function getBillStatus(b) {
  return String(b?.status || b?.bill_status || "").toLowerCase();
}

function extractRoomLabel(bill) {
  if (bill.room?.room_number) return bill.room.room_number;
  const contract = bill.contract;
  if (!contract) return "—";
  const room = contract.room_current || contract.room_history;
  return room?.room_number || "—";
}

const fmtMoney = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

/* ================== EDIT PAGE ================== */
export default function EditBillPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const [staticInfo, setStaticInfo] = useState({
    roomLabel: "—",
    payerName: "—",
    creatorName: "—"
  });

  // Form Data
  const [form, setForm] = useState({
    bill_type: "monthly_rent",
    billing_period_start: "",
    billing_period_end: "",
    due_date: "",
    description: ""
  });

  const [charges, setCharges] = useState([]);

  const totalAmount = useMemo(() => {
    return charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [charges]);

  // Lock logic if utility bill
  const isLocked = form.bill_type === 'utilities';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        const numId = Number(id);
        if (!Number.isFinite(numId)) throw new Error("Invalid Bill ID");

        const detail = await getBillById(numId);

        if (getBillStatus(detail) !== "draft") {
          alert("Hóa đơn đã xuất bản thì không thể chỉnh sửa.");
          navigate(`/bills/${numId}`);
          return;
        }

        if (cancelled) return;

        setStaticInfo({ 
            roomLabel: extractRoomLabel(detail), 
            payerName: detail.tenant?.user?.full_name || `User #${detail.tenant_user_id}`, 
            creatorName: detail.creator?.full_name || "System" 
        });

        setForm({
          bill_type: detail.bill_type || "monthly_rent",
          billing_period_start: parseDate(detail.billing_period_start),
          billing_period_end: parseDate(detail.billing_period_end),
          due_date: parseDate(detail.due_date),
          description: detail.description || "",
        });

        if (detail.service_charges && detail.service_charges.length > 0) {
          setCharges(detail.service_charges.map(c => ({
            service_type: c.service_type,
            quantity: c.quantity,
            unit_price: c.unit_price || c.amount,
            amount: c.amount, 
            description: c.description || ""
          })));
        } else {
          setCharges([{ service_type: "Chi phí", quantity: 1, amount: detail.total_amount || 0, unit_price: detail.total_amount || 0 }]);
        }

      } catch (e) {
        if (!cancelled) setErr(e.message || "Lỗi tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const updateCharge = (index, field, value) => {
    const newCharges = [...charges];
    newCharges[index][field] = value;
    if (field === 'unit_price' || field === 'quantity') {
      const q = Number(field === 'quantity' ? value : newCharges[index].quantity);
      const p = Number(field === 'unit_price' ? value : newCharges[index].unit_price);
      newCharges[index].amount = q * p;
    }
    setCharges(newCharges);
  };

  const addCharge = () => setCharges([...charges, { service_type: "", quantity: 1, unit_price: 0, amount: 0, description: "" }]);
  const removeCharge = (index) => setCharges(charges.filter((_, i) => i !== index));

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        ...form,
        total_amount: totalAmount,
        service_charges: charges.map(c => ({
          service_type: c.service_type,
          quantity: Number(c.quantity),
          unit_price: Number(c.unit_price),
          amount: Number(c.quantity) * Number(c.unit_price),
          description: c.description
        }))
      };

      await updateDraftBill(id, payload);
      alert("Cập nhật thành công!");
      navigate("/bills");
    } catch (e) {
      alert(e.message || "Lỗi cập nhật");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-5 text-center">Đang tải dữ liệu...</div>;
  if (err) return <div className="alert alert-danger m-4">{err}</div>;

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3><Pencil className="me-2" /> Chỉnh Sửa Hóa Đơn (Nháp)</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/bills')}>
          <ArrowLeft className="me-2" /> Quay lại
        </button>
      </div>

      <div className="card shadow-sm p-4 mb-4">
        {/* STATIC INFO */}
        <div className="row mb-4 p-3 bg-light rounded">
          <div className="col-md-4">
            <small className="text-muted">Phòng</small>
            <div className="fw-bold">{staticInfo.roomLabel}</div>
          </div>
          <div className="col-md-4">
            <small className="text-muted">Người thanh toán</small>
            <div className="fw-bold">{staticInfo.payerName}</div>
          </div>
          <div className="col-md-4">
            <small className="text-muted">Người tạo</small>
            <div className="fw-bold">{staticInfo.creatorName}</div>
          </div>
        </div>

        {/* FORM FIELDS */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <label className="form-label fw-bold">Loại hóa đơn</label>
            <select 
                className="form-select" 
                name="bill_type" 
                value={form.bill_type} 
                onChange={onFormChange}
                disabled={isLocked} // Không cho đổi loại nếu là Utility
            >
              <option value="other">Khác</option>
              <option value="monthly_rent">Tiền phòng</option>
              <option value="utilities">Điện nước</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold">Từ ngày</label>
            <input type="date" className="form-control" name="billing_period_start" value={form.billing_period_start} onChange={onFormChange} />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold">Đến ngày</label>
            <input type="date" className="form-control" name="billing_period_end" value={form.billing_period_end} onChange={onFormChange} />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold">Hạn thanh toán</label>
            <input type="date" className="form-control" name="due_date" value={form.due_date} onChange={onFormChange} />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold">Mô tả / Ghi chú</label>
            <textarea className="form-control" rows="2" name="description" value={form.description} onChange={onFormChange} />
          </div>
        </div>

        {/* SERVICE CHARGES */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
                <label className="form-label fw-bold mb-0">Chi tiết phí</label>
                {isLocked && <span className="badge bg-warning text-dark"><Lock className="me-1"/> Đã khóa (Điện nước)</span>}
            </div>
            
            {!isLocked && (
                <button className="btn btn-sm btn-outline-primary" onClick={addCharge}>
                <Plus size={18} /> Thêm dòng
                </button>
            )}
          </div>

          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr className="small text-center">
                <th style={{ width: '35%' }}>Tên phí</th>
                <th style={{ width: '15%' }}>Số lượng</th>
                <th style={{ width: '20%' }}>Đơn giá</th>
                <th style={{ width: '20%' }}>Thành tiền</th>
                {!isLocked && <th style={{ width: '5%' }}></th>}
              </tr>
            </thead>
            <tbody>
              {charges.map((c, i) => (
                <tr key={i}>
                  <td>
                    <input className="form-control form-control-sm mb-1"
                      value={c.service_type}
                      onChange={e => updateCharge(i, 'service_type', e.target.value)}
                      placeholder="VD: Phí vệ sinh"
                      readOnly={isLocked}
                    />
                    <input className="form-control form-control-sm text-muted fst-italic"
                      value={c.description}
                      onChange={e => updateCharge(i, 'description', e.target.value)}
                      placeholder="Ghi chú (tùy chọn)"
                    />
                  </td>
                  <td>
                    <input type="number" className="form-control form-control-sm text-center"
                      value={c.quantity}
                      onChange={e => updateCharge(i, 'quantity', e.target.value)}
                      readOnly={isLocked}
                    />
                  </td>
                  <td>
                    <input type="number" className="form-control form-control-sm text-end"
                      value={c.unit_price}
                      onChange={e => updateCharge(i, 'unit_price', e.target.value)}
                      readOnly={isLocked}
                    />
                  </td>
                  <td className="text-end fw-bold">
                    {fmtMoney(Number(c.quantity) * Number(c.unit_price))}
                  </td>
                  {!isLocked && (
                      <td className="text-center">
                        <button className="btn btn-sm text-danger" onClick={() => removeCharge(i)}>
                          <Trash />
                        </button>
                      </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light">
                <tr>
                    <td colSpan={3} className="text-end fw-bold">TỔNG CỘNG:</td>
                    <td className="text-end fw-bold text-danger fs-5">{fmtMoney(totalAmount)}</td>
                    {!isLocked && <td></td>}
                </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="d-flex justify-content-end gap-3">
        <button className="btn btn-secondary px-4" onClick={() => navigate('/bills')}>
          Hủy bỏ
        </button>
        <button className="btn btn-primary px-4" onClick={onSubmit} disabled={submitting}>
          <Save className="me-2" /> {submitting ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}
