import React, { useContext, useState, useEffect } from "react";
import { RegulationContext } from "@/contexts/RegulationContext";
import { useParams, useNavigate } from "react-router-dom";

export default function EditRegulationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRegulationById, updateRegulation } =
    useContext(RegulationContext);

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const reg = getRegulationById(parseInt(id));
    if (reg) setFormData(reg);
    else alert("Không tìm thấy quy định!");
  }, [id]);

  if (!formData) return <p className="p-6">Đang tải...</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateRegulation(formData.regulation_id, formData);
    alert("✅ Cập nhật thành công!");
    navigate("/regulations");
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">✏️ Chỉnh sửa quy định</h2>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block font-medium mb-2">Tiêu đề *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-2">Nội dung *</label>
          <textarea
            name="content"
            rows="4"
            value={formData.content}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-2">Ngày hiệu lực *</label>
          <input
            type="date"
            name="effective_date"
            value={formData.effective_date}
            onChange={handleChange}
            className="border rounded-lg p-2 w-full"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-gray-300 rounded-lg"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg"
          >
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
