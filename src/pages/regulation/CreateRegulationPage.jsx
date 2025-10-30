import React, { useContext, useState } from "react";
import { RegulationContext } from "@/contexts/RegulationContext";

export default function CreateRegulationPage() {
  const { addRegulation } = useContext(RegulationContext);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    effective_date: "",
    version: 1,
    note: "",
    status: "draft",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.effective_date) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }
    addRegulation({
      ...formData,
      created_by: 1,
      created_at: new Date().toISOString(),
    });
    alert("✅ Tạo quy định mới thành công!");
    setFormData({
      title: "",
      content: "",
      effective_date: "",
      version: 1,
      note: "",
      status: "draft",
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">📝 Tạo quy định mới</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-medium mb-2">Tiêu đề *</label>
          <input
            type="text"
            name="title"
            className="w-full border rounded-lg p-2"
            value={formData.title}
            onChange={handleChange}
            placeholder="Nhập tiêu đề quy định"
          />
        </div>
        <div>
          <label className="block font-medium mb-2">Nội dung *</label>
          <textarea
            name="content"
            rows="4"
            className="w-full border rounded-lg p-2"
            value={formData.content}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block font-medium mb-2">Ngày hiệu lực *</label>
          <input
            type="date"
            name="effective_date"
            className="border rounded-lg p-2 w-full"
            value={formData.effective_date}
            onChange={handleChange}
          />
        </div>
        <div className="flex justify-end">
          <button className="bg-green-600 text-white px-5 py-2 rounded-lg">
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
