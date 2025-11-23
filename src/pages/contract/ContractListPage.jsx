// src/pages/contract/ContractListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listContracts,
  getDownloadUrl,
  deleteContract,
  downloadContractDirect,
} from "../../services/api/contracts";

export default function ContractListPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [original, setOriginal] = useState([]);

  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  // ================== Helpers ==================
  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date)) return "-";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const toVietnameseStatus = (s) => {
    switch (s) {
      case "active":
        return "Hoạt động";
      case "pending":
        return "Đang xử lý";
      case "expired":
        return "Hết hạn";
      case "cancelled":
        return "Đã hủy";
      default:
        return "-";
    }
  };

  // ================== Fetch ==================
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listContracts();
        const items = Array.isArray(data?.items) ? data.items : [];
        setRows(items);
        setOriginal(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ================== AUTO FILTER ==================
  useEffect(() => {
    let filtered = [...original];

    // Search
    if (q.trim() !== "") {
      filtered = filtered.filter((x) =>
        x.tenant_name.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Status
    if (status !== "all") {
      filtered = filtered.filter((x) => x.status === status);
    }

    // Date From
    if (from) {
      const fromTime = new Date(from).setHours(0, 0, 0, 0);
      filtered = filtered.filter(
        (x) => new Date(x.start_date).setHours(0, 0, 0, 0) >= fromTime
      );
    }

    // Date To
    if (to) {
      const toTime = new Date(to).setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (x) => new Date(x.end_date).setHours(0, 0, 0, 0) <= toTime
      );
    }

    setRows(filtered);
  }, [q, status, from, to, original]);

  // ================== Delete ==================
  const onDelete = async (id) => {
    if (!window.confirm("Xoá hợp đồng này?")) return;
    try {
      await deleteContract(id);
      const data = await listContracts();
      const items = Array.isArray(data?.items) ? data.items : [];
      setRows(items);
      setOriginal(items);
      alert("Đã xoá!");
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Xoá hợp đồng thất bại"
      );
    }
  };

  // ================== Download ==================
  // ================== Download ==================
  // ================== Download ==================
  const onDownload = async (id) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/contract/${id}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
        }
      );
      console.log("Download response:", res);

      if (!res.ok) {
        alert("Không thể tải hợp đồng (server trả lỗi).");
        return;
      }

      const json = await res.json();
      console.log("Download response JSON:", json);
      const url = json?.data?.download_url;
      console.log("Download URL:", url);
      const fileName = json?.data?.file_name || `contract-${id}.pdf`;

      if (!url) {
        alert("Không lấy được link tải file từ server.");
        return;
      }

      // Truy cập trực tiếp link S3 → tự động tải
      window.location.href = url;
    } catch (err) {
      console.error("Download error:", err);
      alert("Không tải được hợp đồng");
    }
  };

  // ================== UI ==================
  return (
    <div className="contracts-container">
      <style>{`
        .contracts-container {
          padding: 24px 32px;
          background: #f8fafc;
          color: #0f172a;
          min-height: calc(100vh - 80px);
        }

        h1 {
          font-size: 28px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 20px;
        }

        .card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
        }

        /* === FILTER GRID FIXED === */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 12px;
        }

        @media (min-width: 1100px) {
          .filter-grid {
            grid-template-columns: 200px 200px 200px 1fr;
            align-items: center;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .label {
          font-size: 13px;
          color: #475569;
          margin-bottom: 4px;
        }

        input[type="text"], input[type="date"], select {
          height: 38px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 0 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }

        th, td {
          padding: 12px 16px;
          border-top: 1px solid #E5E7EB;
        }

        thead tr {
          background: #F1F5F9;
        }

        tbody tr:hover {
          background: #F8FAFC;
        }

        .btn-link {
          background: none;
          border: none;
          padding: 4px 8px;
          cursor: pointer;
          color: #0ea5e9;
          font-weight: 600;
        }

        .btn-link:hover { text-decoration: underline; }

        .btn-primary {
          background: #0EA5E9;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-primary:hover {
          background: #0284C7;
        }
      `}</style>

      <h1>Danh Sách Hợp Đồng</h1>

      {/* ================= FILTER ================= */}
      <div className="card">
        <div className="filter-grid">
          <div className="form-group">
            <label className="label">Trạng thái:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="pending">Đang xử lý</option>
              <option value="expired">Hết hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Ngày (Từ):</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">Ngày (Đến):</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">Tìm kiếm:</label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nhập tên người thuê..."
            />
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên Người Thuê</th>
              <th>Số Phòng</th>
              <th>Ngày Bắt Đầu</th>
              <th>Ngày Kết Thúc</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7">Đang tải...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="7">Không có kết quả.</td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={r.contract_id}>
                  <td>{idx + 1}</td>
                  <td>{r.tenant_name}</td>
                  <td>{r.room_number || "-"}</td>
                  <td>{formatDate(r.start_date)}</td>
                  <td>{formatDate(r.end_date)}</td>
                  <td>{toVietnameseStatus(r.status)}</td>

                  <td>
                    <button
                      className="btn-link"
                      onClick={() => nav(`/contracts/${r.contract_id}`)}
                    >
                      Xem
                    </button>
                    |
                    <button
                      className="btn-link"
                      onClick={() => onDownload(r.contract_id)}
                    >
                      Tải
                    </button>
                    |
                    <button
                      className="btn-link"
                      style={{ color: "#E11D48" }}
                      onClick={() => onDelete(r.contract_id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={() => nav("/contracts/create")}
      >
        Tạo hợp đồng mới
      </button>
    </div>
  );
}
