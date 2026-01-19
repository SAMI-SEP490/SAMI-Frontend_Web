import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createDraftBill } from "@/services/api/bills";
import { listAssignedBuildings, listBuildings } from "@/services/api/building";
import { getRoomsByBuildingId, getRoomById } from "@/services/api/rooms";
import { getUserById } from "@/services/api/users";
import { getAccessToken } from "@/services/http";
import { Trash, Plus, Save } from "react-bootstrap-icons";

// --- HELPERS ---
const getRole = () => {
  try {
    const t = getAccessToken();
    return JSON.parse(atob(t.split(".")[1])).role;
  } catch { return ""; }
};

const isValidDate = (dateString) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === dateString;
};

const fmtMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0);

export default function CreateBillPage() {
  const nav = useNavigate();
  const role = getRole();

  // --- STATE ---
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  
  const [activeContract, setActiveContract] = useState(null);
  const [tenantUserId, setTenantUserId] = useState("");
  const [tenantName, setTenantName] = useState("");

  // Bill Info (Mặc định là 'other' vì không làm điện nước ở đây nữa)
  const [billType, setBillType] = useState("other");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  // Service Charges
  const [charges, setCharges] = useState([
    { service_type: "", amount: 0, quantity: 1, unit_price: 0, description: "" }
  ]);
  const [loading, setLoading] = useState(false);

  // --- 1. Fetch Buildings ---
  useEffect(() => {
    (async () => {
      try {
        const api = role === "MANAGER" ? listAssignedBuildings : listBuildings;
        const res = await api();
        setBuildings(Array.isArray(res) ? res : []);
      } catch (e) { console.error(e); }
    })();
  }, [role]);

  // --- 2. Fetch Room List ---
  useEffect(() => {
    if (!selectedBuilding) { setRooms([]); return; }
    (async () => {
      const resRooms = await getRoomsByBuildingId(selectedBuilding);
      setRooms(Array.isArray(resRooms) ? resRooms : []);
    })();
  }, [selectedBuilding]);

  // --- 3. Fetch Contract & Tenant ---
  useEffect(() => {
    if(!selectedRoom) { setActiveContract(null); setTenantUserId(""); setTenantName(""); return; }
    (async () => {
        try {
            const roomDetail = await getRoomById(selectedRoom);
            if (roomDetail?.current_contract) {
                const contract = roomDetail.current_contract;
                setActiveContract(contract);
                setTenantUserId(contract.tenant_user_id);
                try {
                    const uRes = await getUserById(contract.tenant_user_id);
                    const u = uRes?.data || uRes;
                    setTenantName(u.full_name || `User #${contract.tenant_user_id}`);
                } catch { setTenantName("Không xác định"); }
            } else {
                setActiveContract(null);
                setTenantName("");
            }
        } catch (e) { console.error(e); }
    })();
  }, [selectedRoom]);

  // --- HANDLERS ---
  const totalAmount = useMemo(() => charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0), [charges]);

  const addCharge = () => setCharges([...charges, { service_type: "", amount: 0, quantity: 1, unit_price: 0, description: "" }]);
  const removeCharge = (index) => setCharges(charges.filter((_, i) => i !== index));
  
  const updateCharge = (index, field, value) => {
    const newCharges = [...charges];
    newCharges[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
        const q = field === 'quantity' ? value : newCharges[index].quantity;
        const p = field === 'unit_price' ? value : newCharges[index].unit_price;
        newCharges[index].amount = Number(q) * Number(p);
    }
    setCharges(newCharges);
  };

  const onSubmit = async () => {
    if (!activeContract) return alert("Phòng này chưa có hợp đồng!");
    if (!isValidDate(periodStart) || !isValidDate(periodEnd) || !isValidDate(dueDate)) {
        return alert("Ngày tháng không hợp lệ (dd/mm/yyyy).");
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
        return alert("Ngày bắt đầu không thể lớn hơn ngày kết thúc!");
    }

    if (charges.length === 0 || totalAmount <= 0) {
        return alert("Vui lòng nhập ít nhất một khoản phí hợp lệ.");
    }

    setLoading(true);
    try {
      const payload = {
        contract_id: activeContract.contract_id,
        tenant_user_id: tenantUserId,
        bill_type: billType, // 'other' or 'monthly_rent'
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
        due_date: dueDate,
        description: description || "Hóa đơn dịch vụ",
        total_amount: totalAmount,
        status: 'draft',
        service_charges: charges
      };

      await createDraftBill(payload);
      alert("Đã lưu nháp thành công!");
      nav("/bills");
    } catch (e) {
      alert(e.message || "Lỗi tạo hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4">Tạo Hóa Đơn Dịch Vụ / Khác</h3>
      
      <div className="row">
        {/* CỘT TRÁI: THÔNG TIN CHUNG */}
        <div className="col-md-4">
            <div className="card p-3 mb-3 shadow-sm">
                <h6 className="fw-bold text-primary">1. Thông tin Phòng</h6>
                <div className="mb-2">
                    <label className="form-label small text-muted">Tòa nhà</label>
                    <select className="form-select" onChange={e => { setSelectedBuilding(e.target.value); setSelectedRoom(""); }}>
                        <option value="">-- Chọn tòa nhà --</option>
                        {buildings.map(b => <option key={b.building_id} value={b.building_id}>{b.name}</option>)}
                    </select>
                </div>
                <div className="mb-2">
                    <label className="form-label small text-muted">Phòng</label>
                    <select className="form-select" value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                        <option value="">-- Chọn phòng --</option>
                        {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number}</option>)}
                    </select>
                </div>
                {activeContract && (
                    <div className="bg-light p-2 rounded mt-2 border border-success">
                        <div className="small"><strong>HĐ:</strong> {activeContract.contract_number}</div>
                        <div className="small text-success"><strong>Thuê:</strong> {tenantName}</div>
                    </div>
                )}
            </div>

            <div className="card p-3 shadow-sm">
                <h6 className="fw-bold text-primary">2. Cấu hình Hóa đơn</h6>
                <div className="mb-2">
                    <label className="form-label small text-muted">Loại hóa đơn</label>
                    <select className="form-select" value={billType} onChange={e => setBillType(e.target.value)}>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div className="mb-2">
                    <label className="form-label small text-muted">Kỳ thanh toán</label>
                    <div className="d-flex gap-1">
                        <input type="date" className="form-control form-control-sm" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                        <span className="align-self-center">-</span>
                        <input type="date" className="form-control form-control-sm" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                    </div>
                </div>
                <div className="mb-2">
                    <label className="form-label small text-muted">Hạn đóng tiền</label>
                    <input type="date" className="form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div className="mb-2">
                    <label className="form-label small text-muted">Ghi chú</label>
                    <textarea className="form-control" rows="2" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                </div>
            </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT */}
        <div className="col-md-8">
            <div className="card p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold m-0">Chi tiết thanh toán</h6>
                    <button className="btn btn-sm btn-outline-primary" onClick={addCharge}>
                        <Plus size={18}/> Thêm dòng
                    </button>
                </div>

                <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                        <tr className="small text-center">
                            <th style={{width: '35%'}}>Khoản phí</th>
                            <th style={{width: '15%'}}>SL</th>
                            <th style={{width: '20%'}}>Đơn giá</th>
                            <th style={{width: '20%'}}>Thành tiền</th>
                            <th style={{width: '10%'}}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {charges.map((c, i) => (
                            <tr key={i}>
                                <td>
                                    <input 
                                        className="form-control form-control-sm" 
                                        value={c.service_type} 
                                        onChange={e=>updateCharge(i, 'service_type', e.target.value)} 
                                        placeholder="Tên phí..." 
                                    />
                                    <input 
                                        className="form-control form-control-sm mt-1 text-muted fst-italic" 
                                        value={c.description} 
                                        onChange={e=>updateCharge(i, 'description', e.target.value)} 
                                        placeholder="Ghi chú..." 
                                    />
                                </td>
                                <td>
                                    <input type="number" className="form-control form-control-sm text-center" 
                                        value={c.quantity} onChange={e=>updateCharge(i, 'quantity', e.target.value)} />
                                </td>
                                <td>
                                    <input type="number" className="form-control form-control-sm text-end" 
                                        value={c.unit_price} onChange={e=>updateCharge(i, 'unit_price', e.target.value)} />
                                </td>
                                <td className="text-end fw-bold">{fmtMoney(c.amount)}</td>
                                <td className="text-center">
                                    <button className="btn btn-sm text-danger" onClick={()=>removeCharge(i)}><Trash/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="table-light">
                        <tr>
                            <td colSpan={3} className="text-end fw-bold">TỔNG CỘNG:</td>
                            <td className="text-end fw-bold text-danger fs-5">{fmtMoney(totalAmount)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>

                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-light" onClick={()=>nav('/bills')}>Hủy bỏ</button>
                    <button 
                        className="btn btn-warning px-4 fw-bold" 
                        onClick={onSubmit} 
                        disabled={loading || !activeContract}
                    >
                        <Save className="me-2"/>
                        {loading ? "Đang xử lý..." : "Lưu Nháp"}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
