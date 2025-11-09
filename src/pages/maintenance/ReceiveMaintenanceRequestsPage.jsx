import React from "react";
import { useContext } from "react";
import { MaintenanceContext } from "../context/MaintenanceContext";

export default function ReceiveMaintenanceRequestsPage() {
  const { maintenanceRequests, acknowledgeRequest } =
    useContext(MaintenanceContext);

  return (
    <div className="min-h-screen bg-[#F4F6FA] p-6">
      <h1 className="text-2xl font-semibold mb-6">Thông báo bảo trì</h1>

      {maintenanceRequests.length === 0 ? (
        <p className="text-gray-500">Không có yêu cầu mới nào.</p>
      ) : (
        <div className="space-y-4">
          {maintenanceRequests.map((req) => (
            <div
              key={req.request_id}
              className="bg-white border border-[#E6E8ED] rounded-2xl p-4 shadow-sm flex justify-between items-center"
            >
              <div>
                <p>
                  <b>Người thuê ID {req.tenant_user_id}</b> gửi thông báo bảo
                  trì!
                </p>
                <p>🕒 {new Date(req.created_at).toLocaleString()}</p>
                <p>🏠 Phòng: {req.room_id}</p>
                <p>🔧 Loại: {req.category}</p>
                <p>📝 Mô tả: {req.description}</p>
              </div>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                onClick={() => acknowledgeRequest(req.request_id)}
              >
                Đã nắm thông tin
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
