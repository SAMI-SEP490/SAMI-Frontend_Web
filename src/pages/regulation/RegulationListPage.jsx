import React, { useEffect, useState } from "react";
import {
  listRegulations,
  deleteRegulation,
  publishRegulation,
  archiveRegulation,
} from "../../services/api/regulation";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Pencil,
  Trash,
  Archive,
  CloudArrowUp,
} from "react-bootstrap-icons";
import "./RegulationListPage.css";

export default function RegulationListPage() {
  const navigate = useNavigate();

  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function fetchData() {
    try {
      setLoading(true);
      const res = await listRegulations();
      setRegulations(res.data || res);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("❌ Lấy dữ liệu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleDelete(id, status) {
    if (status === "published") {
      alert("❌ Quy định đã xuất bản không thể xóa.");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xóa quy định này?")) return;

    try {
      await deleteRegulation(id);
      alert("🗑️ Đã xóa quy định.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("❌ Xóa thất bại. Vui lòng thử lại.");
    }
  }

  async function handlePublish(id) {
    try {
      await publishRegulation(id);
      alert("✅ Quy định đã được xuất bản.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("❌ Xuất bản thất bại.");
    }
  }

  async function handleArchive(id) {
    try {
      await archiveRegulation(id);
      alert("✅ Quy định đã được hủy xuất bản / lưu trữ.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("❌ Hủy xuất bản thất bại.");
    }
  }

  const filtered = regulations.filter((r) => {
    const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? r.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Danh sách Quy Định</h2>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="🔎 Tìm kiếm theo tiêu đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="published">Đã xuất bản</option>
          <option value="archived">Lưu trữ</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Đối tượng áp dụng</th>
              <th>Ngày hiệu lực</th>
              <th>Người tạo</th>
              <th>Ngày tạo</th>
              <th>Cập nhật</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((reg) => (
              <tr key={reg.regulation_id}>
                <td>{reg.title}</td>
                <td className="tag">
                  {reg.target === "all"
                    ? "Tất cả"
                    : reg.target === "management"
                    ? "Quản lý"
                    : reg.target === "tenants"
                    ? "Khách thuê"
                    : "Không rõ"}
                </td>
                <td>
                  {reg.effective_date
                    ? new Date(reg.effective_date).toLocaleDateString("vi-VN")
                    : "—"}
                </td>
                <td>{reg.created_by?.full_name}</td>
                <td>{new Date(reg.created_at).toLocaleDateString("vi-VN")}</td>
                <td>{new Date(reg.updated_at).toLocaleDateString("vi-VN")}</td>
                <td>
                  <span
                    className={`status ${
                      reg.status === "published"
                        ? "published"
                        : reg.status === "draft"
                        ? "draft"
                        : "archived"
                    }`}
                  >
                    {reg.status === "published"
                      ? "Đã xuất bản"
                      : reg.status === "draft"
                      ? "Nháp"
                      : "Lưu trữ"}
                  </span>
                </td>
                <td className="action-buttons">
                  <button
                    onClick={() =>
                      navigate(`/regulations/${reg.regulation_id}/`)
                    }
                    className="btn view"
                  >
                    <Eye size={16} /> Xem
                  </button>

                  <button
                    disabled={reg.status === "published"}
                    onClick={() =>
                      navigate(`/regulations/${reg.regulation_id}/edit`)
                    }
                    className={`btn edit ${
                      reg.status === "published" ? "disabled" : ""
                    }`}
                  >
                    <Pencil size={16} /> Sửa
                  </button>

                  {reg.status !== "published" ? (
                    <button
                      onClick={() => handlePublish(reg.regulation_id)}
                      className="btn publish"
                    >
                      <CloudArrowUp size={16} />
                      Xuất bản
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchive(reg.regulation_id)}
                      className="btn archive"
                    >
                      <Archive size={16} /> Hủy xuất bản
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(reg.regulation_id, reg.status)}
                    className="btn delete"
                  >
                    <Trash size={16} /> Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="no-data">Không có quy định nào phù hợp.</p>
        )}
      </div>

      <div className="add-button">
        <button
          onClick={() => navigate("/regulations/create")}
          className="btn add"
        >
          + Thêm Quy Định
        </button>
      </div>
    </div>
  );
}
