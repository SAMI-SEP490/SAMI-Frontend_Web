import React, { createContext, useState } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationData, setNotificationData] = useState([
    {
      id: 1,
      title: "Quy định về sử dụng khu vực chung",
      category: "Nội quy tòa nhà",
      effectiveDate: "2025-11-01",
      expiryDate: "2025-12-31",
      status: "Nháp",
      content:
        "Tất cả cư dân cần tuân thủ quy định khi sử dụng khu vực hồ bơi và phòng gym. Không mang theo đồ ăn, thức uống và phải mặc trang phục phù hợp.",
      attachment: "house_rules.pdf",
      building: "Tòa nhà A",
      targets: ["Cư dân", "Khách thuê"],
    },
    {
      id: 2,
      title: "Thông báo bảo trì thang máy",
      category: "Thông báo",
      effectiveDate: "2025-10-30",
      expiryDate: "2025-11-02",
      status: "Đã gửi",
      content:
        "Thang máy khu B sẽ được bảo trì từ ngày 30/10 đến 02/11. Cư dân vui lòng sử dụng thang máy số 2 trong thời gian này.",
      attachment: "maintenance_notice.pdf",
      building: "Tòa nhà B",
      targets: ["Tất cả cư dân"],
    },
    {
      id: 3,
      title: "Cập nhật phí gửi xe tháng 11",
      category: "Thông báo tài chính",
      effectiveDate: "2025-11-01",
      expiryDate: "2025-11-30",
      status: "Nháp",
      content:
        "Phí gửi xe ô tô tháng 11 sẽ tăng thêm 5% do chi phí vận hành. Vui lòng cập nhật thông tin tại quầy lễ tân.",
      attachment: "",
      building: "Tòa nhà C",
      targets: ["Cư dân có ô tô"],
    },
  ]);

  return (
    <NotificationContext.Provider
      value={{
        notificationData,
        setNotificationData,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
