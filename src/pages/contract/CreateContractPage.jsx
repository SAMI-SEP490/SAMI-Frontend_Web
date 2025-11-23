// src/pages/contract/CreateContractPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listRoomsLite } from "../../services/api/rooms";
import { listTenants } from "../../services/api/tenants";
import { http } from "../../services/http";

export default function CreateContractPage() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    roomId: "",
    tenantUserId: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    depositAmount: "",
    status: "pending",
    note: "",
    file: null,
  });

  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(true);

  // Load Rooms + Tenants song song
  useEffect(() => {
    (async () => {
      setLoadingRooms(true);
      setLoadingTenants(true);
      try {
        const [roomsList, tenantsList] = await Promise.all([
          listRoomsLite(),
          listTenants({ take: 1000 }),
        ]);
        setRooms(roomsList || []);
        setTenants(tenantsList || []);
      } catch (err) {
        console.error("Load rooms/tenants error:", err);
        setRooms([]);
        setTenants([]);
      } finally {
        setLoadingRooms(false);
        setLoadingTenants(false);
      }
    })();
  }, []);

  // Handle form change
  const onRoomChange = (e) => {
    setForm((f) => ({ ...f, roomId: e.target.value, tenantUserId: "" }));
  };

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setForm((f) => ({ ...f, file: files?.[0] || null }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const validate = () => {
    if (!form.roomId) return "Vui lòng chọn Phòng.";
    if (!form.tenantUserId) return "Vui lòng chọn Người thuê.";
    if (!form.startDate) return "Vui lòng chọn ngày bắt đầu.";
    if (!form.endDate) return "Vui lòng chọn ngày kết thúc.";
    return "";
  };

  // Submit
  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    try {
      setSaving(true);

      const fd = new FormData();

      // Chỉ append nếu giá trị hợp lệ
      if (form.roomId) fd.append("room_id", Number(form.roomId));
      console.log("form.tenantUserId:", form.tenantUserId);
      if (form.tenantUserId)
        fd.append("tenant_user_id", Number(form.tenantUserId));
      fd.append("start_date", form.startDate);
      fd.append("end_date", form.endDate);
      fd.append("rent_amount", form.rentAmount ? Number(form.rentAmount) : 0);
      fd.append(
        "deposit_amount",
        form.depositAmount ? Number(form.depositAmount) : 0
      );
      fd.append("status", form.status || "pending");
      fd.append("note", form.note || "");
      if (form.file) fd.append("contract_file", form.file);
      console.log("FormData to submit:", fd);
      await http.post("/contract", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Tạo hợp đồng thành công!");
      nav("/contracts");
    } catch (ex) {
      console.error("Create contract error:", ex);
      alert(
        ex?.response?.data?.message || ex?.message || "Tạo hợp đồng thất bại."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-contract-page">
      <style>{`
        .create-contract-page { padding: 24px 32px; background: #F8FAFC; min-height: calc(100vh - 80px); color: #0f172a; box-sizing: border-box; }
        .container { max-width: 900px; margin: 0 auto; }
        .page-title { font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 20px; }
        .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 1100px) { .form-grid { grid-template-columns: 1fr 1fr; } }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field.full { grid-column: 1 / -1; }
        .label { font-size: 13px; color: #475569; }
        input, select, textarea { width: 100%; height: 38px; border: 1px solid #CBD5E1; border-radius: 8px; padding: 0 10px; outline: none; font-size: 14px; background: #fff; }
        textarea { min-height: 92px; padding: 10px; }
        input:focus, select:focus, textarea:focus { border-color: #0EA5E9; box-shadow: 0 0 0 3px rgba(14,165,233,.15); }
        .actions { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }
        .btn { height: 40px; padding: 0 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-primary { background: #0EA5E9; color: #fff; }
        .btn-primary:hover { background: #0284C7; }
        .btn-ghost { background: #E2E8F0; color: #0f172a; }
        .btn-ghost:hover { background: #CBD5E1; }
        .hint { font-size: 12px; color: #64748B; }
      `}</style>

      <div className="container">
        <h1 className="page-title">Tạo hợp đồng mới</h1>

        <form className="card" onSubmit={onSubmit}>
          <div className="form-grid">
            {/* ROOM */}
            <div className="field">
              <label className="label">Phòng *</label>
              <select
                name="roomId"
                value={form.roomId}
                onChange={onRoomChange}
                disabled={loadingRooms}
                required
              >
                <option value="">
                  {loadingRooms ? "Đang tải danh sách phòng..." : "Chọn phòng"}
                </option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                    {r.floor != null ? ` (Tầng ${r.floor})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* TENANT */}
            <div className="field">
              <label className="label">Người thuê *</label>
              <select
                name="tenantUserId"
                value={form.tenantUserId}
                onChange={onChange}
                disabled={loadingTenants}
                required
              >
                <option value="">Chọn người thuê</option>
                {tenants.map((t) => (
                  <option key={t.user_id} value={t.user_id}>
                    {t.full_name || t.fullName || t.name || "Người thuê"}
                    {t.phone ? ` (${t.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* DATES */}
            <div className="field">
              <label className="label">Ngày bắt đầu *</label>
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={onChange}
                required
              />
            </div>

            <div className="field">
              <label className="label">Ngày kết thúc *</label>
              <input
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={onChange}
                required
              />
            </div>

            {/* AMOUNTS */}
            <div className="field">
              <label className="label">Tiền thuê</label>
              <input
                name="rentAmount"
                type="number"
                min="0"
                value={form.rentAmount}
                onChange={onChange}
              />
            </div>

            <div className="field">
              <label className="label">Tiền cọc</label>
              <input
                name="depositAmount"
                type="number"
                min="0"
                value={form.depositAmount}
                onChange={onChange}
              />
            </div>

            {/* STATUS */}
            <div className="field">
              <label className="label">Trạng thái</label>
              <select name="status" value={form.status} onChange={onChange}>
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="terminated">terminated</option>
              </select>
              <div className="hint">
                Mặc định “pending” để đúng luồng duyệt trước khi kích hoạt.
              </div>
            </div>

            {/* NOTE */}
            <div className="field full">
              <label className="label">Ghi chú</label>
              <textarea name="note" value={form.note} onChange={onChange} />
            </div>

            {/* FILE */}
            <div className="field full">
              <label className="label">File hợp đồng (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                name="file"
                onChange={onChange}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => nav("/contracts")}
            >
              Huỷ
            </button>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Đang lưu..." : "Tạo hợp đồng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
