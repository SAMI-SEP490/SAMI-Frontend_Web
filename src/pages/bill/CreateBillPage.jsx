import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createDraftBill } from "@/services/api/bills";
import { listAssignedBuildings, listBuildings, getBuildingById } from "@/services/api/building";
import { getRoomsByBuildingId, getRoomById } from "@/services/api/rooms";
import { getUserById } from "@/services/api/users";
import { getUtilityReadingsForm, submitUtilityReadings } from "@/services/api/utility"; 
import { getAccessToken } from "@/services/http";
import { Trash, Calculator, ExclamationCircle, CloudUpload } from "react-bootstrap-icons";

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
  const [buildingConfig, setBuildingConfig] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  
  const [activeContract, setActiveContract] = useState(null);
  const [tenantUserId, setTenantUserId] = useState("");
  const [tenantName, setTenantName] = useState("");

  // Bill Info
  const [billType, setBillType] = useState("utilities");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  // Utility Readings State
  const [utilityData, setUtilityData] = useState({
    old_electric: 0,
    new_electric: 0,
    old_water: 0,
    new_water: 0
  });

  // Service Charges (Dùng chung cho cả 2 loại bill)
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(false);

  // Điều kiện để cho phép nhập số mới
  const isInputReady = useMemo(() => {
    return selectedBuilding && selectedRoom && isValidDate(periodEnd);
  }, [selectedBuilding, selectedRoom, periodEnd]);

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

  // --- 2. Fetch Room List + Config ---
  useEffect(() => {
    if (!selectedBuilding) { setRooms([]); setBuildingConfig(null); return; }
    (async () => {
      const resRooms = await getRoomsByBuildingId(selectedBuilding);
      setRooms(Array.isArray(resRooms) ? resRooms : []);
      try {
          const resBuilding = await getBuildingById(selectedBuilding);
          const b = resBuilding?.data || resBuilding;
          setBuildingConfig({
              electric_price: Number(b.electric_unit_price || 0),
              water_price: Number(b.water_unit_price || 0),
              service_fee: Number(b.service_fee || 0)
          });
      } catch (e) { console.error(e); }
    })();
  }, [selectedBuilding]);

  // --- 3. Fetch Contract ---
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

  // --- 4. Logic UTILITY: Load Old Readings ---
  useEffect(() => {
    // Chỉ chạy khi đã đủ điều kiện (Có phòng, Có ngày kết thúc)
    if (billType === 'utilities' && isInputReady) {
        (async () => {
            const d = new Date(periodEnd);
            const month = d.getMonth() + 1;
            const year = d.getFullYear();

            const res = await getUtilityReadingsForm({ 
                building_id: selectedBuilding, 
                month, 
                year 
            });
            
            const roomData = Array.isArray(res) ? res.find(r => String(r.room_id) === String(selectedRoom)) : null;

            if (roomData) {
                setUtilityData(prev => ({
                    ...prev,
                    old_electric: roomData.old_electric || 0,
                    old_water: roomData.old_water || 0,
                    // Reset số mới bằng số cũ để user nhập, hoặc lấy số mới nếu đã có
                    new_electric: roomData.new_electric || roomData.old_electric || 0,
                    new_water: roomData.new_water || roomData.old_water || 0,
                }));
            } else {
                // Trường hợp không tìm thấy (VD: tháng đầu tiên), reset về 0
                setUtilityData({ old_electric: 0, new_electric: 0, old_water: 0, new_water: 0 });
            }
        })();
    }
  }, [billType, isInputReady, selectedBuilding, selectedRoom, periodEnd]);

  // --- 5. Auto Calculate Charges ---
  useEffect(() => {
    if (billType !== 'utilities' || !buildingConfig) return;

    const elecUsage = Math.max(0, utilityData.new_electric - utilityData.old_electric);
    const waterUsage = Math.max(0, utilityData.new_water - utilityData.old_water);

    const elecCost = elecUsage * buildingConfig.electric_price;
    const waterCost = waterUsage * buildingConfig.water_price;
    const serviceFee = buildingConfig.service_fee;

    const autoCharges = [
        {
            service_type: "Tiền điện",
            quantity: elecUsage,
            unit_price: buildingConfig.electric_price,
            amount: elecCost,
            description: `Số cũ: ${utilityData.old_electric} - Số mới: ${utilityData.new_electric}`
        },
        {
            service_type: "Tiền nước",
            quantity: waterUsage,
            unit_price: buildingConfig.water_price,
            amount: waterCost,
            description: `Số cũ: ${utilityData.old_water} - Số mới: ${utilityData.new_water}`
        },
        {
            service_type: "Phí dịch vụ chung",
            quantity: 1,
            unit_price: serviceFee,
            amount: serviceFee,
            description: "Vệ sinh, thang máy, rác..."
        }
    ];
    setCharges(autoCharges);
  }, [utilityData, billType, buildingConfig]);

  // --- Handlers ---
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

  // --- [UPDATE 2] MAIN SUBMIT FUNCTION ---
  const onSubmit = async () => {
    if (!activeContract) return alert("Phòng này chưa có hợp đồng!");
    if (!isValidDate(periodStart) || !isValidDate(periodEnd) || !isValidDate(dueDate)) {
        return alert("Ngày tháng không hợp lệ (dd/mm/yyyy).");
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
        return alert("Ngày bắt đầu không thể lớn hơn ngày kết thúc!");
    }

    setLoading(true);
    try {
      // BƯỚC 1: NẾU LÀ BILL ĐIỆN NƯỚC -> GỌI API LƯU CHỈ SỐ TRƯỚC
      if (billType === 'utilities') {
        const d = new Date(periodEnd);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        // Chuẩn bị payload đúng format của submitUtilityReadings
        const utilityPayload = {
            building_id: Number(selectedBuilding),
            billing_month: month,
            billing_year: year,
            readings: [
                {
                    room_id: Number(selectedRoom),
                    new_electric: Number(utilityData.new_electric),
                    new_water: Number(utilityData.new_water),
                    // Có thể gửi kèm old_electric_override nếu backend hỗ trợ sửa số cũ
                }
            ]
        };

        console.log("Submitting Utility Readings:", utilityPayload);
        await submitUtilityReadings(utilityPayload);
      }

      // BƯỚC 2: TẠO BILL DRAFT
      const payload = {
        contract_id: activeContract.contract_id,
        tenant_user_id: tenantUserId,
        bill_type: billType,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
        due_date: dueDate,
        description: description || (billType === 'utilities' ? "Hóa đơn điện nước" : "Hóa đơn khác"),
        total_amount: totalAmount,
        status: 'draft',
        service_charges: charges
      };

      await createDraftBill(payload);
      
      alert(billType === 'utilities' ? "Đã cập nhật chỉ số & Lưu nháp thành công!" : "Đã lưu nháp thành công!");
      nav("/bills");

    } catch (e) {
      console.error(e);
      alert(e.message || "Lỗi khi xử lý dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4">Tạo Hóa Đơn</h3>
      
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
                        <option value="utilities">Điện nước & Dịch vụ</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div className="mb-2">
                    <label className="form-label small text-muted">Kỳ thanh toán (Từ - Đến)</label>
                    <div className="d-flex gap-1">
                        <input type="date" className="form-control form-control-sm" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                        <span className="align-self-center">-</span>
                        <input 
                            type="date" 
                            className={`form-control form-control-sm ${!periodEnd && billType === 'utilities' ? 'border-danger' : ''}`} 
                            value={periodEnd} 
                            onChange={e => setPeriodEnd(e.target.value)} 
                        />
                    </div>
                    {/* Cảnh báo nếu chưa chọn ngày đến */}
                    {!isValidDate(periodEnd) && billType === 'utilities' && (
                        <div className="text-danger small mt-1">
                            <ExclamationCircle className="me-1"/> Vui lòng chọn "Đến ngày" để lấy chỉ số.
                        </div>
                    )}
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

        {/* CỘT PHẢI: TÍNH TOÁN & CHI TIẾT */}
        <div className="col-md-8">
            {/* KHU VỰC NHẬP CHỈ SỐ (CHỈ HIỆN KHI CHỌN UTILITIES) */}
            {billType === 'utilities' && buildingConfig && (
                <div className="card p-3 mb-3 shadow-sm border-primary border-2">
                    <h6 className="fw-bold text-primary mb-3">
                        <Calculator className="me-2"/>
                        Nhập chỉ số Điện / Nước
                    </h6>
                    
                    {/* Cảnh báo block input */}
                    {!isInputReady && (
                        <div className="alert alert-warning py-2 mb-3">
                            <ExclamationCircle className="me-2"/>
                            Vui lòng chọn <strong>Phòng</strong> và <strong>Ngày kết thúc (Đến ngày)</strong> để nhập chỉ số.
                        </div>
                    )}

                    <div className="row g-3">
                        {/* ĐIỆN */}
                        <div className="col-md-6">
                            <div className="p-2 bg-light rounded border">
                                <strong className="d-block mb-2 text-warning">⚡ ĐIỆN ({fmtMoney(buildingConfig.electric_price)} đ/số)</strong>
                                <div className="row">
                                    <div className="col-6">
                                        <label className="small text-muted">Số cũ</label>
                                        <input type="number" className="form-control" value={utilityData.old_electric} readOnly tabIndex={-1} disabled={!isInputReady}/>
                                    </div>
                                    <div className="col-6">
                                        <label className="small text-muted fw-bold">Số mới</label>
                                        <input 
                                            type="number" 
                                            className="form-control border-warning" 
                                            value={utilityData.new_electric} 
                                            onChange={e => setUtilityData({...utilityData, new_electric: Number(e.target.value)})}
                                            disabled={!isInputReady}
                                            placeholder={!isInputReady ? "Chọn ngày..." : ""}
                                        />
                                    </div>
                                </div>
                                <div className="text-end small mt-1">
                                    Tiêu thụ: <strong>{Math.max(0, utilityData.new_electric - utilityData.old_electric)}</strong> số
                                </div>
                            </div>
                        </div>

                        {/* NƯỚC */}
                        <div className="col-md-6">
                            <div className="p-2 bg-light rounded border">
                                <strong className="d-block mb-2 text-info">💧 NƯỚC ({fmtMoney(buildingConfig.water_price)} đ/khối)</strong>
                                <div className="row">
                                    <div className="col-6">
                                        <label className="small text-muted">Số cũ</label>
                                        <input type="number" className="form-control" value={utilityData.old_water} readOnly tabIndex={-1} disabled={!isInputReady}/>
                                    </div>
                                    <div className="col-6">
                                        <label className="small text-muted fw-bold">Số mới</label>
                                        <input 
                                            type="number" 
                                            className="form-control border-info" 
                                            value={utilityData.new_water} 
                                            onChange={e => setUtilityData({...utilityData, new_water: Number(e.target.value)})}
                                            disabled={!isInputReady}
                                            placeholder={!isInputReady ? "Chọn ngày..." : ""}
                                        />
                                    </div>
                                </div>
                                <div className="text-end small mt-1">
                                    Tiêu thụ: <strong>{Math.max(0, utilityData.new_water - utilityData.old_water)}</strong> khối
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BẢNG CHI TIẾT PHÍ */}
            <div className="card p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold m-0">Chi tiết thanh toán</h6>
                    {/* Chỉ cho thêm dòng nếu là bill Other, bill Utility tự động tính */}
                    {billType === 'other' && (
                        <button className="btn btn-sm btn-outline-secondary" onClick={addCharge}>+ Thêm phí</button>
                    )}
                </div>

                <table className="table table-hover table-bordered align-middle">
                    <thead className="table-light">
                        <tr className="small text-center">
                            <th style={{width: '30%'}}>Khoản phí</th>
                            <th style={{width: '10%'}}>SL</th>
                            <th style={{width: '20%'}}>Đơn giá</th>
                            <th style={{width: '20%'}}>Thành tiền</th>
                            {billType === 'other' && <th style={{width: '5%'}}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {charges.map((c, i) => (
                            <tr key={i}>
                                <td>
                                    <input 
                                        className="form-control form-control-sm" 
                                        value={c.service_type} 
                                        readOnly={billType === 'utilities'} 
                                        onChange={e=>updateCharge(i, 'service_type', e.target.value)} 
                                        placeholder="Tên phí..." 
                                    />
                                    {c.description && <div className="small text-muted fst-italic mt-1">{c.description}</div>}
                                </td>
                                <td>
                                    <input type="number" className="form-control form-control-sm text-center" 
                                        value={c.quantity} readOnly={billType === 'utilities'} onChange={e=>updateCharge(i, 'quantity', e.target.value)} />
                                </td>
                                <td>
                                    <input type="number" className="form-control form-control-sm text-end" 
                                        value={c.unit_price || 0} readOnly={billType === 'utilities'} onChange={e=>updateCharge(i, 'unit_price', e.target.value)} />
                                </td>
                                <td className="text-end fw-bold">{fmtMoney(c.amount)}</td>
                                {billType === 'other' && (
                                    <td className="text-center">
                                        <button className="btn btn-sm text-danger" onClick={()=>removeCharge(i)}><Trash/></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="table-light">
                        <tr>
                            <td colSpan={3} className="text-end fw-bold">TỔNG CỘNG:</td>
                            <td className="text-end fw-bold text-danger fs-5">{fmtMoney(totalAmount)}</td>
                            {billType === 'other' && <td></td>}
                        </tr>
                    </tfoot>
                </table>

                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-light" onClick={()=>nav('/bills')}>Hủy bỏ</button>
                    <button 
                        className="btn btn-warning px-4 fw-bold d-flex align-items-center gap-2" 
                        onClick={onSubmit} 
                        disabled={loading || !activeContract}
                    >
                        {loading ? "Đang xử lý..." : (
                            <>
                                {billType === 'utilities' ? <CloudUpload/> : null}
                                {billType === 'utilities' ? " Lưu Nháp & Cập nhật chỉ số" : " Lưu Nháp"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
