import React, { use, useEffect, useState } from "react";
import {
  listRegulations,
  deleteRegulation,
  publishRegulation,
  unpublishRegulation,
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
      console.error(err);
      alert("❌ Lấy dữ liệu thất bại.");
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
      alert("❌ Xóa thất bại.");
    }
  }

  async function handlePublish(id) {
    try {
      await publishRegulation(id);
      alert("✅ Đã xuất bản.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("❌ Xuất bản thất bại.");
    }
  }

  async function handleArchive(id) {
    try {
      await unpublishRegulation(id);
      alert("✅ Đã hủy xuất bản.");
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

  useEffect(() => {
    {
      console.log("regulations:", regulations);
    }
  }, [regulations]);
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
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="center">#</th>
              <th className="center">Tiêu đề</th>
              {/* <th className="center">Đối tượng áp dụng</th> */}
              <th className="center">Ngày hiệu lực</th>
              <th className="center">Người tạo</th>
              <th className="center">Ngày tạo</th>
              <th className="center">Cập nhật</th>
              <th className="center">Trạng thái</th>
              <th className="center action-col">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((reg, index) => (
              <tr key={reg.regulation_id}>
                <td className="center">{index + 1}</td>

                <td>{reg.title}</td>

                {/* <td className="center">
                  <span className="tag">
                    {reg.target === "all"
                      ? "Tất cả"
                      : reg.target === "management"
                      ? "Quản lý"
                      : reg.target === "tenants"
                      ? "Khách thuê"
                      : "Không rõ"}
                  </span>
                </td> */}

                <td className="center">
                  {reg.effective_date
                    ? new Date(reg.effective_date).toLocaleDateString("vi-VN")
                    : "—"}
                </td>

                <td>{reg.created_by?.full_name}</td>

                <td className="center">
                  {new Date(reg.created_at).toLocaleDateString("vi-VN")}
                </td>

                <td className="center">
                  {new Date(reg.updated_at).toLocaleDateString("vi-VN")}
                </td>

                <td className="center">
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
                    className="btn view"
                    onClick={() =>
                      navigate(`/regulations/${reg.regulation_id}`)
                    }
                  >
                    <Eye size={14} /> Xem
                  </button>

                  <button
                    className={`btn edit ${
                      reg.status === "published" ? "disabled" : ""
                    }`}
                    disabled={reg.status === "published"}
                    onClick={() =>
                      navigate(`/regulations/${reg.regulation_id}/edit`)
                    }
                  >
                    <Pencil size={14} /> Sửa
                  </button>

                  {reg.status !== "published" ? (
                    <button
                      className="btn publish"
                      onClick={() => handlePublish(reg.regulation_id)}
                    >
                      <CloudArrowUp size={14} /> Xuất bản
                    </button>
                  ) : (
                    <button
                      className="btn archive"
                      onClick={() => handleArchive(reg.regulation_id)}
                    >
                      <Archive size={14} /> Hủy xuất bản
                    </button>
                  )}

                  <button
                    className="btn delete"
                    onClick={() => handleDelete(reg.regulation_id, reg.status)}
                  >
                    <Trash size={14} /> Xóa
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
          className="btn add"
          onClick={() => navigate("/regulations/create")}
        >
          + Thêm Quy Định
        </button>
      </div>
    </div>
  );
}
