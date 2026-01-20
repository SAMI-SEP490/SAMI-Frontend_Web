import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// [UPDATE] Thêm icon Send
import { Eye, Trash, Pencil, Send, CashStack, ClockHistory, LightningCharge } from "react-bootstrap-icons";
import {
  listBills,
  listDraftBills,
  deleteOrCancelBill,
  updateDraftBill,
  createCashPayment,
  refreshBillStatus,
  extendBill,
} from "../../services/api/bills";
import { listBuildings } from "../../services/api/building";
import { getAccessToken } from "../../services/http";
import "./BillListPage.css";

/* ================= Helpers ================= */
const getRole = () => {
  try {
    const t = getAccessToken();
    return JSON.parse(atob(t.split(".")[1])).role;
  } catch { return ""; }
};

function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function fmtVN(dt) {
  if (!dt) return "—";
  return dt.toLocaleDateString("vi-VN");
}

function fmtMoney(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

const getBillId = (b) => b.id ?? b.bill_id ?? b.billId;

function renderTypeBadge(type) {
    switch(type) {
        case 'monthly_rent': return <span className="badge bg-primary">Tiền nhà</span>;
        case 'utilities': return <span className="badge bg-warning text-dark">Điện nước & Dịch vụ</span>;
        default: return <span className="badge bg-secondary">Khác</span>;
    }
}

function renderStatusBadge(bill) {
  const status = String(bill?.status || "").toLowerCase();
  const map = {
      draft: { text: "Nháp", class: "draft" },
      issued: { text: "Chờ thanh toán", class: "issued" },
      paid: { text: "Đã thanh toán", class: "paid" },
      partially_paid: { text: "Thanh toán 1 phần", class: "partial" },
      overdue: { text: "Quá hạn", class: "overdue" },
      cancelled: { text: "Đã hủy", class: "draft" }
  };
  const s = map[status] || { text: status, class: "draft" };
  return <span className={`status ${s.class}`}>{s.text}</span>;
}

/* ================= Page ================= */
export default function BillListPage() {
  const navigate = useNavigate();
  const role = getRole();
  const isOwner = role === 'OWNER';

  const [bills, setBills] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  /* ================= Fetch Data ================= */
  async function loadData() {
    try {
      setLoading(true);
      
      const [issuedRes, draftRes] = await Promise.allSettled([
        listBills(),
        listDraftBills(),
      ]);

      const issued = issuedRes.status === "fulfilled" ? issuedRes.value : [];
      const drafts = draftRes.status === "fulfilled" ? draftRes.value : [];
      
      const map = new Map();
      [...drafts, ...issued].forEach((b) => {
        const id = getBillId(b);
        if (id != null) map.set(String(id), b);
      });
      const allBills = [...map.values()];
      allBills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setBills(allBills);

      if (isOwner) {
          const bData = await listBuildings();
          setBuildings(bData?.data || bData || []); // Handle wrapper structure if any
      }

    } catch (e) {
      console.error(e);
      alert("Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ================= Logic Actions ================= */
  async function onRefreshStatus() {
    try {
      setRefreshing(true);
      const res = await refreshBillStatus();

      // Lấy data an toàn: Nếu res.data có thì dùng, nếu không thì dùng chính res
      const stats = res.data || res;

      alert(`✅ Đã quét xong!
- Quá hạn: ${stats.bills_marked_overdue ?? 0}
- Tiền nhà mới: ${stats.rent_bills_created ?? 0}
- Điện nước mới: ${stats.utility_bills_created ?? 0}`);

      loadData(); // Reload list
    } catch (e) {
      console.error(e); // Log lỗi để debug nếu cần
      alert(e.message || "Lỗi khi quét tự động");
    } finally {
      setRefreshing(false);
    }
  }

  // [UPDATE] Extend with Prompt for Penalty
  async function onExtend(id) {
      const input = window.prompt("Gia hạn thêm 5 ngày.\nNhập số tiền phạt (VNĐ) nếu có:", "0");
      if (input === null) return; // User cancelled

      const penalty = Number(input);
      if (isNaN(penalty) || penalty < 0) {
          return alert("Số tiền phạt không hợp lệ!");
      }

      try {
          await extendBill(id, penalty);
          alert("✅ Đã gia hạn thành công!");
          loadData();
      } catch (e) {
          alert(e.message || "Lỗi gia hạn");
      }
  }

  // [UPDATE] Publish Draft
  async function onPublish(id, bill) {
    if (!window.confirm("Xuất bản hóa đơn này? Hóa đơn sẽ được gửi đến người thuê.")) return;
    try {
      // Chỉ cần update status, backend sẽ tự handle logic
      await updateDraftBill(id, { ...bill, status: "issued" }); 
      alert("✅ Xuất bản thành công!");
      loadData();
    } catch (e) {
      alert("Lỗi xuất bản: " + e.message);
    }
  }

  async function onCashPay(id) {
    if (!window.confirm("Xác nhận thanh toán TIỀN MẶT?")) return;
    try {
        await createCashPayment(id);
        alert("✅ Đã thanh toán!");
        loadData();
    } catch (e) {
        alert(e.message);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Xóa hóa đơn nháp?")) return;
    await deleteOrCancelBill(id);
    loadData();
  }

  // Helper tìm tên tòa nhà
  const getBuildingName = (bill) => {
      // bill.room.building_id có sẵn nhờ Backend update
      const bId = bill.room?.building_id;
      if (!bId) return "—";
      const b = buildings.find(item => item.building_id === bId);
      return b ? b.name : "—";
  };

  /* ================= Filter Logic ================= */
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // 1. Building Filter
      if (isOwner && buildingFilter !== "all") {
          const bId = b.room?.building_id;
          if (String(bId) !== String(buildingFilter)) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "all") {
          if (b.status !== statusFilter) return false;
      }

      // 3. Date Filter
      const created = parseDate(b.created_at);
      if (fromDate && created < new Date(fromDate)) return false;
      if (toDate && created > new Date(toDate + "T23:59:59")) return false;

      // 4. Search
      if (search) {
          const s = search.toLowerCase();
          const room = (b.room?.room_number || "—").toLowerCase();
          const tenant = (b.tenant?.user?.full_name || "").toLowerCase();
          const billNum = (b.bill_number || "").toLowerCase();
          if (!room.includes(s) && !tenant.includes(s) && !billNum.includes(s)) return false;
      }

      return true;
    });
  }, [bills, buildingFilter, statusFilter, fromDate, toDate, search, isOwner, buildings]);

  if (loading) return <div className="loading-text"><div className="spinner-border text-primary"/></div>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="title m-0">Quản lý Hóa đơn</h2>
          <button 
            className="btn btn-success d-flex align-items-center gap-2 px-3 py-2" 
            onClick={onRefreshStatus}
            disabled={refreshing}
          >
            {refreshing ? <div className="spinner-border spinner-border-sm"/> : <LightningCharge size={18}/>}
            {refreshing ? "Đang xử lý..." : "Tạo tiền nhà & điện nước ngay"}
          </button>
      </div>

      <div className="filter-bar">
        {isOwner && (
            <select className="filter-control" value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)} style={{maxWidth: 200}}>
                <option value="all">Tất cả tòa nhà</option>
                {buildings.map(b => (
                    <option key={b.building_id} value={b.building_id}>{b.name}</option>
                ))}
            </select>
        )}

        <select className="filter-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="issued">Chờ thanh toán</option>
            <option value="overdue">Quá hạn</option>
            <option value="paid">Đã thanh toán</option>
        </select>

        <div className="date-group">
          <input type="date" className="filter-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <span>-</span>
          <input type="date" className="filter-control" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>

        <input 
            type="text" 
            className="filter-control flex-grow-1" 
            placeholder="Tìm phòng, tên khách, mã HĐ..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
        />

        <button className="btn-create" onClick={() => navigate("/bills/create")}>
          + Tạo hóa đơn
        </button>
      </div>

      <div className="table-wrapper">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th style={{width: '5%'}}>#</th>
              {isOwner && <th style={{width: '15%'}}>Tòa nhà</th>}
              <th style={{width: '8%'}}>Phòng</th>
              <th style={{width: '20%'}}>Tên hóa đơn</th>
              <th style={{width: '10%'}} className="text-center">Loại</th>
              <th style={{width: '10%'}} className="text-center">Ngày tạo</th>
              <th style={{width: '12%'}} className="text-end">Tổng tiền</th>
              <th style={{width: '10%'}} className="text-center">Trạng thái</th>
              <th style={{width: '10%'}} className="text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filteredBills.map((b, i) => (
                <tr key={getBillId(b)}>
                  <td>{i + 1}</td>
                  
                  {isOwner && (
                      <td className="small text-muted">
                          {getBuildingName(b)}
                      </td>
                  )}

                  <td className="fw-bold">{b.room?.room_number || "—"}</td>
                  
                  <td>
                      <div className="fw-medium text-truncate" style={{maxWidth: 200}} title={b.description}>
                          {b.description || `Hóa đơn ${b.bill_number}`}
                      </div>
                      <div className="small text-muted">{b.bill_number}</div>
                  </td>

                  <td className="text-center">{renderTypeBadge(b.bill_type)}</td>
                  
                  <td className="text-center small">{fmtVN(parseDate(b.created_at))}</td>
                  
                  <td className="text-end fw-bold text-primary">
                      {fmtMoney(Number(b.total_amount) + Number(b.penalty_amount || 0))}
                  </td>

                  <td className="text-center">{renderStatusBadge(b)}</td>

                  <td>
                    <div className="d-flex justify-content-center gap-2">
                        {/* View */}
                        <button className="btn btn-light btn-sm" title="Xem chi tiết" onClick={() => navigate(`/bills/${getBillId(b)}`)}>
                            <Eye/>
                        </button>

                        {/* Draft Actions */}
                        {b.status === 'draft' && (
                            <>
                                <button className="btn btn-warning btn-sm text-white" title="Sửa" onClick={() => navigate(`/bills/${getBillId(b)}/edit`)}>
                                    <Pencil/>
                                </button>
                                {/* [UPDATE] Nút Xuất Bản (Send) đã quay lại */}
                                <button className="btn btn-primary btn-sm" title="Xuất bản" onClick={() => onPublish(getBillId(b), b)}>
                                    <Send/>
                                </button>
                                <button className="btn btn-danger btn-sm" title="Xóa" onClick={() => onDelete(getBillId(b))}>
                                    <Trash/>
                                </button>
                            </>
                        )}

                        {/* Issued/Overdue Actions */}
                        {['issued', 'overdue'].includes(b.status) && (
                            <button className="btn btn-success btn-sm" title="Thanh toán tiền mặt" onClick={() => onCashPay(getBillId(b))}>
                                <CashStack/>
                            </button>
                        )}

                        {/* Overdue: Extend */}
                        {b.status === 'overdue' && (
                            <button className="btn btn-info btn-sm text-white" title="Gia hạn" onClick={() => onExtend(getBillId(b))}>
                                <ClockHistory/>
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
        
        {filteredBills.length === 0 && <div className="no-data">Không tìm thấy hóa đơn nào.</div>}
      </div>
    </div>
  );
}
