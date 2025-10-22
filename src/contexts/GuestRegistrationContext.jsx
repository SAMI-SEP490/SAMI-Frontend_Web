import React, { createContext, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const GuestRegistrationContext = createContext();

export const GuestRegistrationProvider = ({ children }) => {
  const [guestRegistrationData, setGuestRegistrationData] = useState([
    {
      id: "A01234",
      sentDate: "20/09/2025",
      status: "Pending",
      name: "Nguyễn Văn A",
      phone: "0912123456",
      room: "101",
      startDate: "20/09/2025",
      endDate: "28/09/2025",
      reason: "Thăm người thân",
      additionalInfo: "Không có",
    },
    {
      id: "A01233",
      sentDate: "20/09/2025",
      status: "Approved",
      name: "Nguyễn Văn A",
      phone: "0912123456",
      room: "102",
      startDate: "20/07/2025",
      endDate: "27/07/2025",
      reason: "Thăm người thân",
      additionalInfo: "Không có",
    },
    {
      id: "A01235",
      sentDate: "15/08/2025",
      status: "Rejected",
      name: "Trần Thị C",
      phone: "0988777666",
      room: "203",
      startDate: "18/08/2025",
      endDate: "22/08/2025",
      reason: "Công tác ngắn ngày",
      additionalInfo: "Không có",
    },
    {
      id: "A01236",
      sentDate: "10/09/2025",
      status: "Approved",
      name: "Phạm Văn D",
      phone: "0909988777",
      room: "305",
      startDate: "12/09/2025",
      endDate: "18/09/2025",
      reason: "Tham quan du lịch",
      additionalInfo: "Không có",
    },
    {
      id: "A01237",
      sentDate: "05/10/2025",
      status: "Pending",
      name: "Lê Thị E",
      phone: "0933444555",
      room: "406",
      startDate: "07/10/2025",
      endDate: "10/10/2025",
      reason: "Thăm bạn bè",
      additionalInfo: "Mang theo quà tặng",
    },
  ]);

  return (
    <GuestRegistrationContext.Provider
      value={{
        guestRegistrationData,
        setGuestRegistrationData,
      }}
    >
      {children}
    </GuestRegistrationContext.Provider>
  );
};
