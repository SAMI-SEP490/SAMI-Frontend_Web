// src/pages/contract/ContractListPage.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/SideBar";
import Header from "../../components/Header"; // thêm header giống Tenant List
import { useNavigate } from "react-router-dom";
import {
  listContracts,
  getDownloadUrl,
  deleteContract,
  downloadContractDirect,
} from "../../services/api/contracts";

export default function ContractListPage() {
  const nav = useNavigate();

  // data
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // filter (UI-only)
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listContracts(); // không gửi page/size để tránh 400
        setRows(Array.isArray(data?.items) ? data.items : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm("Xoá hợp đồng này?")) return;
    try {
      await deleteContract(id);
      const data = await listContracts();
      setRows(Array.isArray(data?.items) ? data.items : []);
      alert("Đã xoá!");
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Xoá hợp đồng thất bại"
      );
    }
  };

  const onDownload = async (id) => {
    try {
      const { url } = await getDownloadUrl(id);
      if (url) window.open(url, "_blank", "noopener");
      else await downloadContractDirect(id);
    } catch {
      alert("Không tải được hợp đồng");
    }
  };

  const onSearch = (e) => {
    e?.preventDefault?.();
    // khi BE sẵn lọc, map các state status/from/to/q vào params của listContracts
  };

  return (
    <div className="contracts-page">
      {/* CSS cục bộ (không phụ thuộc Tailwind/Bootstrap) */}
      <style>{`
        .contracts-page {
          display: flex;
          min-height: 100vh;
          background: #F8FAFC; /* slate-50 */
          color: #0f172a;      /* slate-900 */
        }
        .contracts-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0; /* fix overflow khi bảng dài */
        }

        /* FULL-WIDTH: container 100% */
        .contracts-container {
          width: 100%;
          padding: 20px 24px 36px;
          box-sizing: border-box;
        }

        .contracts-title {
          font-size: 28px;
          line-height: 1.2;
          font-weight: 700;
          margin: 12px 0 16px 0;
          text-align: center; /* giống ảnh bạn gửi */
        }

        .card {
          background: #fff;
          border: 1px solid #E5E7EB;       /* slate-200 */
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          padding: 16px;
        }

        /* Filter grid full-width */
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 1100px) {
          .filter-grid {
            grid-template-columns: 220px 1fr 1fr 360px 100px; /* trạng thái | từ | đến | ô tìm | nút */
            align-items: end;
          }
        }

        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; color: #475569; } /* slate-600 */

        input[type="text"], input[type="date"], select {
          height: 38px;
          border: 1px solid #CBD5E1; /* slate-300 */
          border-radius: 8px;
          padding: 0 10px;
          outline: none;
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
        }
        input[type="text"]:focus, input[type="date"]:focus, select:focus {
          border-color: #0EA5E9;        /* sky-500 */
          box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          border-radius: 8px;
          border: 0;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s, opacity .15s;
          user-select: none;
          white-space: nowrap;
        }
        .btn-primary {
          background: #0EA5E9; color: #fff; /* sky-500 */
        }
        .btn-primary:hover { background: #0284C7; } /* sky-600 */
        .btn-danger { background: #E11D48; color: #fff; }  /* rose-600 */
        .btn-danger:hover { background: #BE123C; }         /* rose-700 */
        .btn-link {
          background: transparent; color: #0EA5E9; padding: 0; height: auto;
        }
        .btn-link:hover { color: #0284C7; text-decoration: underline; }
        .btn:disabled { opacity: .6; cursor: default; }

        /* CARD table */
        .table-card { margin-top: 16px; }
        .table-wrap { overflow-x: auto; }
        table { min-width: 100%; border-collapse: collapse; font-size: 14px; background: #fff; }
        thead tr { background: #F1F5F9; } /* slate-100 */
        th, td { padding: 12px 16px; text-align: left; white-space: nowrap; }
        tbody tr { border-top: 1px solid #E5E7EB; }
        tbody tr:hover { background: #F8FAFC; }

        /* FOOTER: upload trái, nút tạo phải (full-width) */
        .footer-row {
          display: flex; gap: 12px; margin-top: 16px;
          flex-direction: column;
        }
        @media (min-width: 900px) {
          .footer-row { flex-direction: row; justify-content: space-between; align-items: center; }
        }
        .upload-left { display: flex; align-items: center; gap: 12px; }
        .file-input { font-size: 14px; }
      `}</style>

      {/* Sidebar giữ nguyên */}
      <Sidebar />

      {/* Cột nội dung + Header bar giống Tenant List */}
      <div className="contracts-content">
        <Header /> {/* header xanh, lấy user & logout giống trang khác */}
        <div className="contracts-container">
          {/* Title */}
          <h1 className="contracts-title">Danh Sách Hợp Đồng</h1>

          {/* FILTER CARD */}
          <form className="card" onSubmit={onSearch}>
            <div className="filter-grid">
              <div className="form-group">
                <label className="label">Trạng thái:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="pending">Đang xử lý</option>
                  <option value="expired">Hết hạn</option>
                  <option value="cancelled">Đã huỷ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Ngày (Từ):</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div className="form-group">
                <label className="label">Ngày (Đến):</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div className="form-group" style={{ gridColumn: "span 1" }}>
                <label className="label">Tìm kiếm:</label>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nhập tên hoặc mã hợp đồng..."
                />
              </div>

              <div className="form-group" style={{ alignItems: "flex-end" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  Tìm
                </button>
              </div>
            </div>
          </form>

          {/* TABLE CARD */}
          <div className="card table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID Hợp Đồng</th>
                    <th>Tên Người Thuê</th>
                    <th>Số phòng</th>
                    <th>Ngày Bắt Đầu</th>
                    <th>Ngày Kết Thúc</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ color: "#64748B" /* slate-500 */ }}
                      >
                        Đang tải...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ color: "#64748B" }}>
                        Chưa có hợp đồng nào.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const id = r.contract_id || r.id;
                      const tenantName =
                        r?.tenant?.full_name || r?.tenant_name || "-";
                      const roomNo =
                        r?.room?.room_number || r?.room_number || "-";
                      const start = r?.start_date || r?.startDate || "-";
                      const end = r?.end_date || r?.endDate || "-";
                      const statusText = r?.status || "-";

                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{tenantName}</td>
                          <td>{roomNo}</td>
                          <td>{start}</td>
                          <td>{end}</td>
                          <td>{statusText}</td>
                          <td>
                            <button
                              className="btn btn-link"
                              onClick={() => nav(`/contracts/${id}`)}
                            >
                              Xem chi tiết
                            </button>
                            <span style={{ margin: "0 8px", color: "#94A3B8" }}>
                              |
                            </span>
                            <button
                              className="btn btn-link"
                              onClick={() => onDownload(id)}
                            >
                              Tải
                            </button>
                            <span style={{ margin: "0 8px", color: "#94A3B8" }}>
                              |
                            </span>
                            <button
                              className="btn btn-link"
                              style={{ color: "#E11D48" }}
                              onClick={() => onDelete(id)}
                            >
                              Xoá
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER ROW */}

          <button
            className="btn btn-primary"
            onClick={() => nav("/contracts/create")}
            style={{ alignSelf: "flex-start" }}
          >
            Tạo hợp đồng mới
          </button>
        </div>
      </div>
    </div>
  );
}
