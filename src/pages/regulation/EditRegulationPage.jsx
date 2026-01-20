// src/screens/regulation/EditRegulationPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getRegulationById,
  updateRegulation,
} from "../../services/api/regulation";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function EditRegulationPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  /* ===============================
   * FORM STATE (CHỈ TRƯỜNG ĐƯỢC SỬA)
   * =============================== */
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(null);
  const [note, setNote] = useState("");

  // trạng thái cố định
  const status = "draft";

  /* ===============================
   * UI STATE
   * =============================== */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ===============================
   * LOAD REGULATION
   * =============================== */
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getRegulationById(id);

        setTitle(res.title || "");
        setContent(res.content || "");
        setEffectiveDate(
          res.effective_date ? new Date(res.effective_date) : null,
        );
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

  /* ===============================
   * SUBMIT
   * =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Tiêu đề không được để trống");
      return;
    }

    setSaving(true);
    try {
      await updateRegulation(id, {
        title,
        content,
        effective_date: effectiveDate
          ? new Date(
              effectiveDate.getFullYear(),
              effectiveDate.getMonth(),
              effectiveDate.getDate(),
              12, // tránh lỗi lệch ngày do timezone
            ).toISOString()
          : null,
        note,
        status, // luôn là draft
      });

      setSuccess("Cập nhật quy định thành công!");
      setTimeout(() => navigate("/regulations"), 1000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật quy định.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="p-6 text-center text-gray-500 text-lg">
        Đang tải dữ liệu...
      </p>
    );
  }

  /* ===============================
   * UI
   * =============================== */
  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6">Chỉnh sửa Quy Định</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        {/* Tiêu đề */}
        <Form.Group className="mb-4">
          <Form.Label>Tiêu đề *</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề..."
            required
          />
        </Form.Group>

        {/* Nội dung */}
        <Form.Group className="mb-4">
          <Form.Label>Nội dung</Form.Label>
          <Form.Control
            as="textarea"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung quy định..."
          />
        </Form.Group>

        {/* Ngày hiệu lực */}
        <Form.Group className="mb-4">
          <Form.Label>Ngày hiệu lực</Form.Label>
          <DatePicker
            selected={effectiveDate}
            onChange={(date) => setEffectiveDate(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            placeholderText="Chọn ngày hiệu lực..."
          />
        </Form.Group>

        {/* Ghi chú */}
        <Form.Group className="mb-4">
          <Form.Label>Ghi chú</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú (nếu có)..."
          />
        </Form.Group>

        <div className="flex justify-between items-center mt-4">
          <Button variant="secondary" onClick={() => navigate("/regulations")}>
            ← Trở về
          </Button>

          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
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
