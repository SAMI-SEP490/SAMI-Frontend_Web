// src/pages/contract/CreateContractPage.jsx
import React, { useState } from "react";
import Sidebar from "../../components/SideBar";
import { useNavigate } from "react-router-dom";
import { createContract } from "../../services/api/contracts";

function CreateContractPage() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    roomId: "",
    tenantUserId: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    depositAmount: "",
    note: "",
    file: null,
  });

  const onChange = (e) => {
    const { name, value, files } = e.target;
    setForm((s) => ({ ...s, [name]: files ? files[0] : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") fd.append(k, v);
      });
      await createContract(fd);
      alert("Tạo hợp đồng thành công!");
      nav("/contracts");
    } catch (err) {
      alert(err?.response?.data?.message || "Tạo hợp đồng thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-xl font-semibold mb-4">Tạo hợp đồng</h1>

        <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
          <div>
            <label className="block text-sm mb-1">Phòng (roomId)</label>
            <input
              name="roomId"
              className="border rounded p-2 w-full"
              value={form.roomId}
              onChange={onChange}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Người thuê (tenantUserId)
            </label>
            <input
              name="tenantUserId"
              className="border rounded p-2 w-full"
              value={form.tenantUserId}
              onChange={onChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                name="startDate"
                className="border rounded p-2 w-full"
                value={form.startDate}
                onChange={onChange}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Ngày kết thúc</label>
              <input
                type="date"
                name="endDate"
                className="border rounded p-2 w-full"
                value={form.endDate}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Tiền thuê</label>
              <input
                name="rentAmount"
                className="border rounded p-2 w-full"
                value={form.rentAmount}
                onChange={onChange}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Tiền cọc</label>
              <input
                name="depositAmount"
                className="border rounded p-2 w-full"
                value={form.depositAmount}
                onChange={onChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Ghi chú</label>
            <textarea
              name="note"
              className="border rounded p-2 w-full"
              value={form.note}
              onChange={onChange}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">File hợp đồng (PDF)</label>
            <input type="file" name="file" onChange={onChange} />
          </div>

          <div className="flex gap-2">
            <button
              disabled={saving}
              className="px-4 py-2 bg-[#123b82] text-white rounded"
            >
              {saving ? "Đang tạo..." : "Tạo hợp đồng"}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => nav("/contracts")}
            >
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateContractPage;
