// src/screens/regulation/EditRegulationPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getRegulationById,
  updateRegulation,
} from "../../services/api/regulation";
import { listBuildings } from "../../services/api/building";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function EditRegulationPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(null);
  const [status, setStatus] = useState("draft");
  const [target, setTarget] = useState("all");
  const [note, setNote] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ===============================
  // 📌 Load buildings
  // ===============================
  useEffect(() => {
    async function fetchBuildings() {
      try {
        setLoadingBuildings(true);
        const res = await listBuildings();
        setBuildings(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBuildings(false);
      }
    }
    fetchBuildings();
  }, []);

  // ===============================
  // 📌 Load regulation by ID
  // ===============================
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getRegulationById(id);

        setTitle(res.title || "");
        setContent(res.content || "");
        setBuildingId(res.building_id || "");
        setEffectiveDate(
          res.effective_date ? new Date(res.effective_date) : null
        );
        setStatus(res.status || "draft");
        setTarget(res.target || "all");
        setNote(res.note || "");
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu quy định.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  // ===============================
  // 📌 Submit
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Tiêu đề không được để trống!");
      return;
    }

    setSaving(true);
    try {
      await updateRegulation(id, {
        title,
        content,
        building_id: buildingId ? Number(buildingId) : null,
        effective_date: effectiveDate ? effectiveDate.toISOString() : null,
        status,
        target,
        note,
      });

      setSuccess("Cập nhật quy định thành công!");
      setTimeout(() => navigate("/regulations"), 1000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật quy định."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <p className="p-6 text-center text-gray-500 text-lg">
        Đang tải dữ liệu...
      </p>
    );

  // ===============================
  // 📌 UI Rendering
  // ===============================
  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6">Chỉnh sửa Quy Định</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        {/* Title */}
        <Form.Group className="mb-4" controlId="formTitle">
          <Form.Label>Tiêu đề *</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập tiêu đề..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        {/* Content */}
        <Form.Group className="mb-4" controlId="formContent">
          <Form.Label>Nội dung</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            placeholder="Nhập nội dung quy định..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Form.Group>

        {/* Building */}
        <Form.Group className="mb-4" controlId="formBuilding">
          <Form.Label>Tòa nhà áp dụng</Form.Label>
          <Form.Select
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
          >
            <option value="">-- Không áp dụng tòa nhà --</option>

            {loadingBuildings ? (
              <option>Đang tải...</option>
            ) : (
              buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || `Tòa nhà #${b.id}`}
                </option>
              ))
            )}
          </Form.Select>
        </Form.Group>

        {/* Effective Date */}
        <Form.Group className="mb-4" controlId="formEffectiveDate">
          <Form.Label>Ngày hiệu lực</Form.Label>
          <DatePicker
            selected={effectiveDate}
            onChange={(date) => setEffectiveDate(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            placeholderText="Chọn ngày hiệu lực..."
          />
        </Form.Group>

        {/* Status */}
        <Form.Group className="mb-4" controlId="formStatus">
          <Form.Label>Trạng thái</Form.Label>
          <Form.Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Nháp</option>
            <option value="archived">Lưu trữ</option>
          </Form.Select>
        </Form.Group>

        {/* Target */}
        <Form.Group className="mb-4" controlId="formTarget">
          <Form.Label>Đối tượng áp dụng</Form.Label>
          <Form.Select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="management">Quản lý</option>
            <option value="tenants">Khách thuê</option>
          </Form.Select>
        </Form.Group>

        {/* Note */}
        <Form.Group className="mb-4" controlId="formNote">
          <Form.Label>Ghi chú</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Nhập ghi chú (nếu có)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Form.Group>

        <div className="flex justify-between items-center mt-4">
          {/* Back Button */}
          <Button
            variant="secondary"
            className="px-5 py-2 rounded-lg"
            onClick={() => navigate("/regulations")}
          >
            ← Trở về
          </Button>

          {/* Save Button */}
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition"
            disabled={saving}
          >
            {saving ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "💾 Lưu thay đổi"
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
