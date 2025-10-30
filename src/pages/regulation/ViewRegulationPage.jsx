import React, { useContext } from "react";
import { RegulationContext } from "@/contexts/RegulationContext";
import { useParams, useNavigate } from "react-router-dom";

export default function ViewRegulationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRegulationById, deleteRegulation } =
    useContext(RegulationContext);

  const reg = getRegulationById(parseInt(id));

  if (!reg)
    return <p className="p-6 text-center text-gray-500">Không tìm thấy quy định.</p>;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">{reg.title}</h2>

      <div className="text-gray-700 mb-6 whitespace-pre-line">
        {reg.content}
      </div>

      <div className="text-sm text-gray-500 space-y-1 mb-6">
        <p>📅 Ngày hiệu lực: {reg.effective_date}</p>
        <p>🧾 Trạng thái: {reg.status}</p>
        <p>🕓 Ngày tạo: {new Date(reg.created_at).toLocaleDateString()}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/regulations/edit/${reg.regulation_id}`)}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
        >
          Chỉnh sửa
        </button>
        <button
          onClick={() => {
            if (window.confirm("Xóa quy định này?")) {
              deleteRegulation(reg.regulation_id);
              alert("🗑️ Đã xóa quy định.");
              navigate("/regulations");
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Xóa
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 rounded-lg"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
}
