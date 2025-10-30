import React, { useState, createContext } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const MaintenanceContext = createContext();

export const MaintenanceProvider = ({ children }) => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([
    {
      request_id: "MR-001",
      tenant_user_id: 4,
      room_id: "101",
      title: "Sửa vòi nước bị rò rỉ",
      description: "Vòi nước trong phòng tắm bị rò nước liên tục.",
      category: "plumbing",
      priority: "high",
      status: "pending",
      assigned_to: 2,
      created_at: "2025-10-01",
      updated_at: null,
      resolved_at: null,
      note: "",
    },
    {
      request_id: "MR-002",
      tenant_user_id: 5,
      room_id: "202",
      title: "Đèn phòng khách bị hỏng",
      description: "Đèn không sáng dù đã thay bóng mới.",
      category: "electrical",
      priority: "normal",
      status: "in_progress",
      assigned_to: 3,
      created_at: "2025-09-28",
      updated_at: "2025-09-29",
      resolved_at: null,
      note: "Đã lên lịch sửa.",
    },
    {
      request_id: "MR-003",
      tenant_user_id: 6,
      room_id: "303",
      title: "Khóa cửa không hoạt động",
      description: "Cửa phòng 303 không thể khóa được từ bên ngoài.",
      category: "security",
      priority: "urgent",
      status: "completed",
      assigned_to: 2,
      created_at: "2025-08-15",
      updated_at: "2025-08-16",
      resolved_at: "2025-08-16",
      note: "Đã thay khóa mới.",
    },
  ]);

  const [selectedRequest, setSelectedRequest] = useState(null);

  // ✅ NEW: Danh sách yêu cầu đã nắm thông tin
  const [acknowledgedRequests, setAcknowledgedRequests] = useState([]);

  // ✅ NEW: Khi Building Manager xác nhận đã nắm thông tin
  const acknowledgeRequest = (id) => {
    const found = maintenanceRequests.find((r) => r.request_id === id);
    if (found) {
      setAcknowledgedRequests((prev) => [...prev, found]);
      setMaintenanceRequests((prev) =>
        prev.filter((r) => r.request_id !== id)
      );
    }
  };

  const addRequest = (newRequest) => {
    setMaintenanceRequests((prev) => [...prev, newRequest]);
  };

  const updateRequestStatus = (id, newStatus) => {
    setMaintenanceRequests((prev) =>
      prev.map((r) =>
        r.request_id === id ? { ...r, status: newStatus } : r
      )
    );
  };

  return (
    <MaintenanceContext.Provider
      value={{
        maintenanceRequests,
        setMaintenanceRequests,
        selectedRequest,
        setSelectedRequest,
        addRequest,
        updateRequestStatus,
        // ✅ thêm 2 cái mới:
        acknowledgeRequest,
        acknowledgedRequests,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};
