// src/pages/contract/CreateContractPage.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/SideBar";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import { createContract } from "../../services/api/contracts";
import { listRoomsLite } from "../../services/api/rooms";
import { listTenantsByRoom } from "../../services/api/tenants";

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

  // dữ liệu cho dropdown
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // load phòng khi mở trang
  useEffect(() => {
    (async () => {
      setLoadingRooms(true);
      try {
        const list = await listRoomsLite();
        setRooms(list);
      } finally {
        setLoadingRooms(false);
      }
    })();
  }, []);

  // đổi phòng -> xoá chọn tenant + fetch tenants theo phòng
  const onRoomChange = async (e) => {
    const roomId = e.target.value;
    setForm((f) => ({ ...f, roomId, tenantUserId: "" }));
    setTenants([]);
    if (!roomId) return;

    setLoadingTenants(true);
    try {
      const list = await listTenantsByRoom(roomId);
      setTenants(list);
    } finally {
      setLoadingTenants(false);
    }
  };

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setForm((f) => ({ ...f, file: files && files[0] ? files[0] : null }));
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

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    try {
      setSaving(true);
      await createContract(form);
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
        .create-contract-page {
          display: flex;
          min-height: 100vh;
          background: #F8FAFC;
          color: #0f172a;
        }
        .content-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .container { width: 100%; padding: 20px 24px 40px; box-sizing: border-box; }
        .page-title { font-size: 28px; line-height: 1.2; font-weight: 700; margin: 12px 0 16px; text-align: center; }
        .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,.04); padding: 16px; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 1100px) { .form-grid { grid-template-columns: 1fr 1fr; } }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field.full { grid-column: 1 / -1; }
        .label { font-size: 13px; color: #475569; }
        input[type="text"], input[type="date"], input[type="number"], select, textarea {
          width: 100%; height: 38px; border: 1px solid #CBD5E1; border-radius: 8px; padding: 0 10px; outline: none; font-size: 14px; box-sizing: border-box; background: #fff;
        }
        textarea { min-height: 92px; padding: 10px; }
        input:focus, select:focus, textarea:focus { border-color: #0EA5E9; box-shadow: 0 0 0 3px rgba(14,165,233,.15); }
        .actions { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }
        .btn { display: inline-flex; align-items: center; justify-content: center; height: 40px; padding: 0 16px; border-radius: 8px; border: 0; font-weight: 600; cursor: pointer; user-select: none; transition: background .15s, opacity .15s; }
        .btn-primary { background: #0EA5E9; color: #fff; }
        .btn-primary:hover { background: #0284C7; }
        .btn-ghost { background: #E2E8F0; color: #0f172a; }
        .btn-ghost:hover { background: #CBD5E1; }
        .btn:disabled { opacity: .6; cursor: default; }
        .hint { font-size: 12px; color: #64748B; }
      `}</style>

      <Sidebar />

      <div className="content-col">
        <Header />

        <div className="container">
          <h1 className="page-title">Tạo hợp đồng mới</h1>

          <form className="card" onSubmit={onSubmit}>
            <div className="form-grid">
              {/* PHÒNG */}
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
                    {loadingRooms
                      ? "Đang tải danh sách phòng..."
                      : "Chọn phòng"}
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                      {r.floor != null ? ` (Tầng ${r.floor})` : ""}
                    </option>
                  ))}
                </select>
                {!loadingRooms && rooms.length === 0 && (
                  <div className="hint">Không có phòng nào khả dụng.</div>
                )}
              </div>

              {/* NGƯỜI THUÊ (phụ thuộc PHÒNG) */}
              <div className="field">
                <label className="label">Người thuê *</label>
                <select
                  name="tenantUserId"
                  value={form.tenantUserId}
                  onChange={onChange}
                  disabled={!form.roomId || loadingTenants}
                  required
                >
                  {!form.roomId ? (
                    <option value="">Chọn phòng trước</option>
                  ) : loadingTenants ? (
                    <option value="">Đang tải người thuê...</option>
                  ) : tenants.length ? (
                    <>
                      <option value="">Chọn người thuê</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.phone ? ` (${t.phone})` : ""}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="">Phòng chưa có người thuê</option>
                  )}
                </select>
              </div>

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

              <div className="field full">
                <label className="label">Ghi chú</label>
                <textarea name="note" value={form.note} onChange={onChange} />
              </div>

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

            <div className="actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => nav("/contracts")}
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Tạo hợp đồng"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
