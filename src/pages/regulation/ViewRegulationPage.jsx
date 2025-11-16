import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRegulationById,
  publishRegulation,
  archiveRegulation,
} from "../../services/api/regulation";
import "./ViewRegulationPage.css"; // import CSS riêng

export default function ViewRegulationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [regulation, setRegulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchRegulation() {
      try {
        setLoading(true);
        const res = await getRegulationById(id);
        setRegulation(res.data || res);
      } catch (err) {
        console.error("Fetch error:", err);
        alert("❌ Không thể lấy thông tin quy định.");
      } finally {
        setLoading(false);
      }
    }
    fetchRegulation();
  }, [id]);

  const handlePublish = async () => {
    if (!window.confirm("Bạn có chắc muốn xuất bản quy định này?")) return;
    try {
      setActionLoading(true);
      await publishRegulation(id);
      alert("✅ Quy định đã được xuất bản.");
      const res = await getRegulationById(id);
      setRegulation(res.data || res);
    } catch (err) {
      console.error(err);
      alert("❌ Xuất bản thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Bạn có chắc muốn hủy xuất bản quy định này?")) return;
    try {
      setActionLoading(true);
      await archiveRegulation(id);
      alert("✅ Quy định đã được hủy xuất bản / lưu trữ.");
      const res = await getRegulationById(id);
      setRegulation(res.data || res);
    } catch (err) {
      console.error(err);
      alert("❌ Hủy xuất bản thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p className="loading-text">Đang tải thông tin quy định...</p>;
  }

  if (!regulation) {
    return <p className="error-text">Không tìm thấy quy định.</p>;
  }

  return (
    <div className="container">
      <h2 className="title">Chi tiết Quy Định</h2>

      <div className="info-grid">
        <div className="info-item">
          <p className="label">Tiêu đề:</p>
          <div className="value">{regulation.title}</div>
        </div>

        <div className="info-item">
          <p className="label">Đối tượng áp dụng:</p>
          <div className="value">
            {regulation.target === "all"
              ? "Tất cả"
              : regulation.target === "management"
              ? "Quản lý"
              : regulation.target === "tenants"
              ? "Khách thuê"
              : "Không rõ"}
          </div>
        </div>

        <div className="info-item">
          <p className="label">Trạng thái:</p>
          <div className="value">
            {regulation.status === "published"
              ? "Đã xuất bản"
              : regulation.status === "draft"
              ? "Nháp"
              : "Lưu trữ"}
          </div>
        </div>

        <div className="info-item">
          <p className="label">Ngày hiệu lực:</p>
          <div className="value">
            {regulation.effective_date
              ? new Date(regulation.effective_date).toLocaleDateString("vi-VN")
              : "—"}
          </div>
        </div>

        <div className="info-item">
          <p className="label">Ngày tạo:</p>
          <div className="value">
            {new Date(regulation.created_at).toLocaleDateString("vi-VN")}
          </div>
        </div>

        <div className="info-item">
          <p className="label">Cập nhật:</p>
          <div className="value">
            {new Date(regulation.updated_at).toLocaleDateString("vi-VN")}
          </div>
        </div>

        <div className="info-item full-width">
          <p className="label">Người tạo:</p>
          <div className="value">{regulation.created_by?.full_name || "—"}</div>
        </div>

        <div className="info-item full-width">
          <p className="label">Nội dung:</p>
          <div className="value content">
            <div
              dangerouslySetInnerHTML={{ __html: regulation.content || "—" }}
            />
          </div>
        </div>
      </div>

      <div className="button-group">
        {regulation.status !== "published" ? (
          <button
            onClick={handlePublish}
            disabled={actionLoading}
            className={`btn publish ${actionLoading ? "disabled" : ""}`}
          >
            Xuất bản
          </button>
        ) : (
          <button
            onClick={handleArchive}
            disabled={actionLoading}
            className={`btn archive ${actionLoading ? "disabled" : ""}`}
          >
            Hủy xuất bản
          </button>
        )}
        <button onClick={() => navigate("/regulations")} className="btn back">
          Quay lại danh sách
        </button>
      </div>
    </div>
  );
}
