// src/pages/contract/ContractListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listContracts, deleteContract } from "../../services/api/contracts";
import { Eye, Download, Trash } from "react-bootstrap-icons";
import "./ContractListPage.css";

export default function ContractListPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [original, setOriginal] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  /* ================= Helpers ================= */
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

  const renderStatus = (s) => {
    switch (s) {
      case "active":
        return <span className="status published">Có hiệu lực</span>;
      case "pending":
        return <span className="status draft">Đang xử lý</span>;
      case "expired":
        return <span className="status archived">Hết hạn</span>;
      case "cancelled":
        return <span className="status archived">Đã hủy</span>;
      default:
        return "—";
    }
  };

  /* ================= Fetch ================= */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listContracts();
        const items = Array.isArray(data?.items) ? data.items : [];
        setContracts(items);
        setOriginal(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ================= Filter ================= */
  const filteredContracts = useMemo(() => {
    return original
      .filter((c) => {
        if (!q.trim()) return true;
        return c.tenant_name?.toLowerCase().includes(q.trim().toLowerCase());
      })
      .filter((c) => {
        if (!status) return true;
        return c.status === status;
      })
      .filter((c) => {
        if (!from) return true;
        const f = new Date(from).setHours(0, 0, 0, 0);
        return new Date(c.start_date).setHours(0, 0, 0, 0) >= f;
      })
      .filter((c) => {
        if (!to) return true;
        const t = new Date(to).setHours(23, 59, 59, 999);
        return new Date(c.end_date).setHours(0, 0, 0, 0) <= t;
      });
  }, [q, status, from, to, original]);

  /* ================= Actions ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa hợp đồng này?")) return;
    await deleteContract(id);
    setOriginal((prev) => prev.filter((c) => c.contract_id !== id));
  };

  const handleDownload = (id) => {
    window.location.href = `${
      import.meta.env.VITE_API_BASE_URL
    }/contract/${id}/download`;
  };

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Danh sách hợp đồng</h2>

      {/* FILTER + ACTION */}
      <div className="filter-bar grid">
        <input
          className="search-input"
          placeholder="🔎 Tìm theo tên người thuê..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="status-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Có hiệu lực</option>
          <option value="pending">Đang xử lý</option>
          <option value="expired">Hết hạn</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        <input
          type="date"
          className="search-input"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <input
          type="date"
          className="search-input"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <button
          className="btn add"
          onClick={() => navigate("/contracts/create")}
        >
          + Tạo hợp đồng mới
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="center">#</th>
              <th>Tên người thuê</th>
              <th className="center">Phòng</th>
              <th className="center">Bắt đầu</th>
              <th className="center">Kết thúc</th>
              <th className="center">Trạng thái</th>
              <th className="center action-col">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filteredContracts.map((c, i) => (
              <tr key={c.contract_id}>
                <td className="center">{i + 1}</td>
                <td>{c.tenant_name}</td>
                <td className="center">{c.room_number || "—"}</td>
                <td className="center">{formatDate(c.start_date)}</td>
                <td className="center">{formatDate(c.end_date)}</td>
                <td className="center">{renderStatus(c.status)}</td>

                <td className="action-buttons">
                  <button
                    className="btn view"
                    onClick={() => navigate(`/contracts/${c.contract_id}`)}
                  >
                    <Eye size={14} /> Xem
                  </button>

                  <button
                    className="btn publish"
                    onClick={() => handleDownload(c.contract_id)}
                  >
                    <Download size={14} /> Tải
                  </button>

                  <button
                    className="btn delete"
                    onClick={() => handleDelete(c.contract_id)}
                  >
                    <Trash size={14} /> Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContracts.length === 0 && (
          <p className="no-data">Không có hợp đồng nào.</p>
        )}
      </div>
    </div>
  );
}
