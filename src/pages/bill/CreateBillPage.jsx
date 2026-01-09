// src/pages/bill/CreateBillPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createDraftBill } from "@/services/api/bills";
import { listAssignedBuildings, listBuildings } from "@/services/api/building";
import { getRoomsByBuildingId, getRoomById } from "@/services/api/rooms"; // [1] Import getRoomById
import { getAccessToken } from "@/services/http";
import { Trash } from "react-bootstrap-icons";

// Helpers
const getRole = () => {
  try {
    const t = getAccessToken();
    return JSON.parse(atob(t.split(".")[1])).role;
  } catch { return ""; }
};

export default function CreateBillPage() {
  const nav = useNavigate();
  const role = getRole();

  // Selection State
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  
  // Contract & Tenant State
  const [activeContract, setActiveContract] = useState(null); 
  const [tenantUserId, setTenantUserId] = useState(""); // [NEW] Track selected payer

  // Bill State
  const [billType, setBillType] = useState("monthly_rent");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  // Service Charges
  const [charges, setCharges] = useState([
    { service_type: "Tiền thuê phòng", amount: 0, quantity: 1, description: "" }
  ]);

  const [loading, setLoading] = useState(false);

  // 1. Fetch Buildings
  useEffect(() => {
    (async () => {
      try {
        const api = role === "MANAGER" ? listAssignedBuildings : listBuildings;
        const res = await api();
        setBuildings(Array.isArray(res) ? res : []);
      } catch (e) { console.error(e); }
    })();
  }, [role]);

  // 2. Fetch Rooms List (Lite version)
  useEffect(() => {
    if (!selectedBuilding) { setRooms([]); return; }
    (async () => {
      const res = await getRoomsByBuildingId(selectedBuilding);
      setRooms(Array.isArray(res) ? res : []);
    })();
  }, [selectedBuilding]);

  // 3. [FIXED] Fetch Room Detail to get Contract
  useEffect(() => {
    if(!selectedRoom) { 
        setActiveContract(null); 
        setTenantUserId("");
        return; 
    }

    (async () => {
        try {
            // Call API to get full room details (including current_contract)
            const roomDetail = await getRoomById(selectedRoom);
            
            if (roomDetail?.current_contract) {
                console.log(`found contract`);
                setActiveContract(roomDetail.current_contract);
                // Auto-select the primary tenant from contract
                setTenantUserId(roomDetail.current_contract.tenant_user_id);
            } else {
                console.log(`not found contract`);
                setActiveContract(null);
                setTenantUserId("");
            }
        } catch (e) {
            console.error("Failed to load room details:", e);
            setActiveContract(null);
        }
    })();
  }, [selectedRoom]);

  // Calc Total
  const totalAmount = useMemo(() => {
    return charges.reduce((sum, c) => sum + (Number(c.amount) * Number(c.quantity)), 0);
  }, [charges]);

  // Handlers
  const addCharge = () => {
    setCharges([...charges, { service_type: "", amount: 0, quantity: 1, description: "" }]);
  };

  const removeCharge = (index) => {
    setCharges(charges.filter((_, i) => i !== index));
  };

  const updateCharge = (index, field, value) => {
    const newCharges = [...charges];
    newCharges[index][field] = value;
    setCharges(newCharges);
  };

  const onSubmit = async (status) => {
    if (!activeContract) return alert("Phòng này chưa có hợp đồng/người thuê!");
    if (!tenantUserId) return alert("Không xác định được người thanh toán!");

    setLoading(true);
    try {
      const payload = {
        contract_id: activeContract.contract_id,
        tenant_user_id: tenantUserId, // Send the selected payer
        bill_type: billType,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
        due_date: dueDate,
        description,
        total_amount: totalAmount,
        status: status,
        service_charges: charges
      };

      if (status === 'draft') await createDraftBill(payload);
      else await createDraftBill(payload); 

      alert("Thành công!");
      nav("/bills");
    } catch (e) {
      alert(e.message || "Lỗi tạo hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h3>Tạo Hóa Đơn Mới</h3>
      
      <div className="card p-3 mb-4">
        <h5>1. Chọn Phòng</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label>Tòa nhà</label>
            <select className="form-select" onChange={e => { setSelectedBuilding(e.target.value); setSelectedRoom(""); }}>
              <option value="">-- Chọn --</option>
              {buildings.map(b => <option key={b.building_id} value={b.building_id}>{b.name}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label>Phòng</label>
            <select className="form-select" value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
              <option value="">-- Chọn --</option>
              {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number}</option>)}
            </select>
          </div>
        </div>
        
        {/* Status Indicators */}
        {selectedRoom && !activeContract && (
            <div className="alert alert-warning mt-3">
                <i className="bi bi-exclamation-triangle"></i> Phòng này hiện đang trống (chưa có Hợp đồng Active).
            </div>
        )}
        
        {activeContract && (
            <div className="alert alert-success mt-3 py-2">
                <strong>Hợp đồng:</strong> {activeContract.contract_number} <br/>
                <strong>Người thuê (Chính):</strong> User ID #{activeContract.tenant_user_id}
            </div>
        )}
      </div>

      <div className="card p-3 mb-4">
        <h5>2. Thông tin chung</h5>
        <div className="row g-3">
          <div className="col-md-3">
            <label>Loại</label>
            <select className="form-select" value={billType} onChange={e => setBillType(e.target.value)}>
                <option value="monthly_rent">Tiền nhà</option>
                <option value="utilities">Điện nước</option>
                <option value="other">Khác</option>
            </select>
          </div>
          <div className="col-md-3"><label>Từ ngày</label><input type="date" className="form-control" onChange={e=>setPeriodStart(e.target.value)}/></div>
          <div className="col-md-3"><label>Đến ngày</label><input type="date" className="form-control" onChange={e=>setPeriodEnd(e.target.value)}/></div>
          <div className="col-md-3"><label>Hạn chót</label><input type="date" className="form-control" onChange={e=>setDueDate(e.target.value)}/></div>
          <div className="col-12"><label>Mô tả</label><input className="form-control" onChange={e=>setDescription(e.target.value)}/></div>
        </div>
      </div>

      <div className="card p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>3. Chi tiết (Service Charges)</h5>
            <button className="btn btn-sm btn-outline-primary" onClick={addCharge}>+ Thêm dòng</button>
        </div>
        
        <table className="table">
            <thead>
                <tr>
                    <th style={{width: '35%'}}>Loại phí</th>
                    <th style={{width: '15%'}}>Số lượng</th>
                    <th style={{width: '20%'}}>Đơn giá</th>
                    <th style={{width: '20%'}}>Thành tiền</th>
                    <th style={{width: '10%'}}></th>
                </tr>
            </thead>
            <tbody>
                {charges.map((c, i) => (
                    <tr key={i}>
                        <td><input className="form-control" value={c.service_type} onChange={e=>updateCharge(i, 'service_type', e.target.value)} placeholder="Tên phí..." /></td>
                        <td><input type="number" className="form-control" value={c.quantity} onChange={e=>updateCharge(i, 'quantity', e.target.value)} /></td>
                        <td><input type="number" className="form-control" value={c.amount} onChange={e=>updateCharge(i, 'amount', e.target.value)} /></td>
                        <td className="align-middle">{(Number(c.quantity) * Number(c.amount)).toLocaleString()}</td>
                        <td className="text-center align-middle"><button className="btn btn-sm text-danger" onClick={()=>removeCharge(i)}><Trash/></button></td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={3} className="text-end fw-bold">TỔNG CỘNG:</td>
                    <td className="fw-bold text-primary fs-5">{totalAmount.toLocaleString()} VND</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
      </div>

      <div className="d-flex gap-2 justify-content-end">
        <button className="btn btn-secondary" onClick={()=>nav('/bills')}>Hủy</button>
        <button className="btn btn-warning" onClick={()=>onSubmit('draft')} disabled={loading || !activeContract}>Lưu Nháp</button>
      </div>
    </div>
  );
}
