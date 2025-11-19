// src/pages/contract/ContractListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listContracts,
  getDownloadUrl,
  deleteContract,
  downloadContractDirect,
} from "../../services/api/contracts";

import { listUsers } from "../../services/api/users";
import { getAllTenants } from "../../services/api/tenants";

export default function ContractListPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // filter (UI-only)
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listContracts();
        setRows(Array.isArray(data?.items) ? data.items : []);
        console.log("Contracts:", data);
        const users = await listUsers();
        console.log("Users:", users);
        const tenants = await getAllTenants();
        console.log("Tenants:", tenants);
        setUsers(Array.isArray(users?.items) ? users.items : []);
        setTenants(Array.isArray(tenants?.items) ? tenants.items : []);
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

  const getFullNameByTenantId = (tenantId) => {
    if (!tenantId) return "-";

    const tenant = tenants.find((t) => t.id == tenantId);
    if (!tenant) return "-";

    const user = users.find((u) => u.id == tenant.user_id);
    return user?.full_name || "-";
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
  };

  return (
    <div className="contracts-container">
      <style>{`
        .contracts-container {
          padding: 24px 32px;
          background: #f8fafc;
          color: #0f172a;
          min-height: calc(100vh - 80px); /* trừ phần header layout */
          box-sizing: border-box;
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
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          padding: 16px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 1100px) {
          .filter-grid {
            grid-template-columns: 220px 1fr 1fr 360px 100px;
            align-items: end;
          }
        }

        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 13px; color: #475569; }

        input[type="text"], input[type="date"], select {
          height: 38px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 0 10px;
          outline: none;
          font-size: 14px;
          width: 100%;
        }
        input:focus, select:focus {
          border-color: #0EA5E9;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: 0.2s;
        }
        .btn-primary { background: #0EA5E9; color: #fff; }
        .btn-primary:hover { background: #0284C7; }
        .btn-link { background: none; color: #0EA5E9; }
        .btn-link:hover { text-decoration: underline; }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          font-size: 14px;
          background: #fff;
        }
        th, td { padding: 12px 16px; text-align: left; border-top: 1px solid #E5E7EB; }
        thead tr { background: #F1F5F9; }
        tbody tr:hover { background: #F8FAFC; }
      `}</style>

      <h1>Danh Sách Hợp Đồng</h1>

      <form className="card" onSubmit={onSearch}>
        <div className="filter-grid">
          <div className="form-group">
            <label className="label">Trạng thái:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
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
              placeholder="Nhập tên hoặc mã hợp đồng..."
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Tìm
          </button>
        </div>
      </form>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
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
                <td colSpan="7">Chưa có hợp đồng nào.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.contract_id}>
                  <td>{r.contract_id}</td>
                  <td>{r.tenant_name}</td>
                  <td>{r.room_number || "-"}</td>
                  <td>{r.start_date || "-"}</td>
                  <td>{r.end_date || "-"}</td>
                  <td>{r.status || "-"}</td>
                  <td>
                    <button
                      className="btn btn-link"
                      onClick={() => nav(`/contracts/${r.contract_id}`)}
                    >
                      Xem
                    </button>{" "}
                    |{" "}
                    <button
                      className="btn btn-link"
                      onClick={() => onDownload(r.contract_id)}
                    >
                      Tải
                    </button>{" "}
                    |{" "}
                    <button
                      className="btn btn-link"
                      style={{ color: "#E11D48" }}
                      onClick={() => onDelete(r.contract_id)}
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
