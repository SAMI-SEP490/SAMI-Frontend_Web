// src/pages/contract/ContractListPage.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/SideBar";
import { useNavigate } from "react-router-dom";
import {
  listContracts,
  getDownloadUrl, // đã được export trong service mới
  deleteContract,
  downloadContractDirect,
} from "../../services/api/contracts";

function ContractListPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // giữ 10/trang
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // chỉ gọi '/contract/list?page=...&limit=...'
      const data = await listContracts({ page, limit });
      // Tuỳ response của BE. Mặc định mình hỗ trợ 2 dạng:
      // 1) {items: [...], total: n} hoặc
      // 2) {data: {items: [...], total: n}}
      const items =
        data?.items ?? data?.data?.items ?? data?.data ?? data ?? [];
      setRows(Array.isArray(items) ? items : []);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Không tải được danh sách hợp đồng"
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onDelete = async (id) => {
    if (!window.confirm("Xoá hợp đồng này?")) return;
    try {
      await deleteContract(id);
      await fetchData();
      alert("Đã xoá!");
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Xoá hợp đồng thất bại"
      );
    }
  };

  const onDownload = async (id) => {
    try {
      // Nếu BE có URL ký sẵn:
      const { url } = await getDownloadUrl(id);
      if (url) {
        window.open(url, "_blank", "noopener");
        return;
      }
      // Nếu không có URL ký sẵn → tải trực tiếp
      const res = await downloadContractDirect(id);
      const blob = new Blob([res.data]);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `contract-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
      alert("Không tải được hợp đồng");
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Danh Sách Hợp Đồng</h1>
          <button
            className="px-4 py-2 bg-[#123b82] text-white rounded"
            onClick={() => nav("/contracts/create")}
          >
            Tạo hợp đồng mới
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded bg-red-50 text-red-700">{error}</div>
        )}

        <div className="border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">ID Hợp Đồng</th>
                <th className="p-2 text-left">Tên Người Thuê</th>
                <th className="p-2 text-left">Số phòng</th>
                <th className="p-2 text-left">Ngày Bắt Đầu</th>
                <th className="p-2 text-left">Ngày Kết Thúc</th>
                <th className="p-2 text-left">Trạng Thái</th>
                <th className="p-2 text-left">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3" colSpan={7}>
                    Đang tải...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-3" colSpan={7}>
                    Chưa có hợp đồng nào.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.contract_id || r.id} className="border-t">
                    <td className="p-2">{r.contract_id || r.id}</td>
                    <td className="p-2">
                      {r?.tenant?.full_name || r?.tenant_name || "-"}
                    </td>
                    <td className="p-2">
                      {r?.room?.room_number || r?.room_number || "-"}
                    </td>
                    <td className="p-2">
                      {r?.start_date || r?.startDate || "-"}
                    </td>
                    <td className="p-2">{r?.end_date || r?.endDate || "-"}</td>
                    <td className="p-2">{r?.status || "-"}</td>
                    <td className="p-2 space-x-2">
                      <button
                        className="px-2 py-1 text-xs bg-gray-200 rounded"
                        onClick={() =>
                          nav(`/contracts/${r.contract_id || r.id}`)
                        }
                      >
                        Xem
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                        onClick={() => onDownload(r.contract_id || r.id)}
                      >
                        Tải
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                        onClick={() => onDelete(r.contract_id || r.id)}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bộ phân trang đơn giản */}
        <div className="mt-4 flex items-center gap-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Trước
          </button>
          <span>Trang {page}</span>
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContractListPage;
