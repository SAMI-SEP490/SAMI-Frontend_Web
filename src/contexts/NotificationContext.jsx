import React, { createContext, useState } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  // Danh sách thông báo/quy định hiển thị trên web.
  // Ban đầu để rỗng, không dùng dữ liệu mock nữa.
  const [notificationData, setNotificationData] = useState([]);

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
