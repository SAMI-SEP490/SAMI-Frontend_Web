// src/screens/regulation/CreateRegulationPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRegulation } from "../../services/api/regulation";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateRegulationPage() {
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(null);
  const [note, setNote] = useState("");

  // Fixed values
  const status = "draft";

  // Request state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // helper: convert Date -> yyyy-MM-dd (KHÔNG timezone)
  const formatDateOnly = (date) => {
    if (!date) return null;
    return date.toLocaleDateString("en-CA"); // yyyy-MM-dd
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Tiêu đề không được để trống!");
      return;
    }

    setLoading(true);
    try {
      await createRegulation({
        title,
        content,
        effective_date: formatDateOnly(effectiveDate),
        status, // luôn là draft
        note,
      });

      setSuccess("Tạo quy định thành công!");
      setTimeout(() => navigate("/regulations"), 1000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi tạo quy định.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6">Tạo Quy Định Mới</h2>

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

        <div className="flex justify-between">
          {/* Back */}
          <Button
            variant="secondary"
            className="px-5 py-2 rounded-lg"
            onClick={() => navigate("/regulations")}
          >
            ← Trở về
          </Button>

          {/* Submit */}
          <Button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-colors"
            disabled={loading}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "+ Tạo quy định"
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
