import React, { useContext, useState } from "react";
import { GuestRegistrationContext } from "../../contexts/GuestRegistrationContext";
import { colors } from "../../constants/colors";

function ReceiveGuestRegistrationPage() {
  const { guestRegistrationData, setGuestRegistrationData } = useContext(
    GuestRegistrationContext
  );

  const [showPopup, setShowPopup] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [actionType, setActionType] = useState("");

  const openPopup = (guest, type) => {
    setSelectedGuest(guest);
    setActionType(type);
    setShowPopup(true);
  };

  const confirmAction = () => {
    const newStatus = actionType === "approve" ? "Approved" : "Rejected";
    const updatedData = guestRegistrationData.map((guest) =>
      guest.id === selectedGuest.id
        ? { ...guest, status: newStatus, actionDone: true }
        : guest
    );
    setGuestRegistrationData(updatedData);
    setShowPopup(false);
    setSelectedGuest(null);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "Pending":
        return "Chờ phản hồi";
      case "Approved":
        return "Đồng ý";
      case "Rejected":
        return "Từ chối";
      default:
        return status;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.background,
        padding: "30px",
        overflowY: "auto",
      }}
    >
      <h2 style={{ marginBottom: "20px", color: colors.brand }}>
        Danh sách khách tạm trú
      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          backgroundColor: "#fff",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Phòng</th>
            <th style={thStyle}>Tên khách</th>
            <th style={thStyle}>Số điện thoại</th>
            <th style={thStyle}>Ngày bắt đầu</th>
            <th style={thStyle}>Ngày kết thúc</th>
            <th style={thStyle}>Lí do</th>
            <th style={thStyle}>Thông tin thêm</th>
            <th style={thStyle}>Trạng thái</th>
            <th style={thStyle}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {guestRegistrationData.map((guest, index) => (
            <tr key={guest.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={tdStyle}>{index + 1}</td>
              <td style={tdStyle}>{guest.room}</td>
              <td style={tdStyle}>{guest.name}</td>
              <td style={tdStyle}>{guest.phone}</td>
              <td style={tdStyle}>{guest.startDate}</td>
              <td style={tdStyle}>{guest.endDate}</td>
              <td style={tdStyle}>{guest.reason}</td>
              <td style={tdStyle}>{guest.additionalInfo}</td>
              <td
                style={{
                  ...tdStyle,
                  fontWeight: "bold",
                  color: getStatusColor(guest.status),
                }}
              >
                {getStatusLabel(guest.status)}
              </td>
              <td style={tdStyle}>
                {guest.status === "Pending" && !guest.actionDone && (
                  <>
                    <button
                      style={acceptButtonStyle}
                      onClick={() => openPopup(guest, "approve")}
                    >
                      Phê duyệt
                    </button>
                    <button
                      style={rejectButtonStyle}
                      onClick={() => openPopup(guest, "reject")}
                    >
                      Từ chối
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showPopup && (
        <div style={popupOverlayStyle}>
          <div style={popupStyle}>
            <p style={{ fontSize: "18px", marginBottom: "20px" }}>
              Bạn có chắc chắn muốn{" "}
              {actionType === "approve" ? "phê duyệt" : "từ chối"} khách tạm trú
              này không?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                style={cancelButtonStyle}
                onClick={() => setShowPopup(false)}
              >
                Hủy
              </button>
              <button style={confirmButtonStyle} onClick={confirmAction}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Màu trạng thái
const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "#e0a800"; // vàng
    case "Approved":
      return "#28a745"; // xanh
    case "Rejected":
      return "#dc3545"; // đỏ
    default:
      return "#000";
  }
};

// Style
const thStyle = {
  borderBottom: "2px solid #ccc",
  padding: "10px",
  fontWeight: "bold",
};

const tdStyle = {
  padding: "8px",
};

const acceptButtonStyle = {
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  padding: "5px 10px",
  marginRight: "8px",
  borderRadius: "4px",
  cursor: "pointer",
};

const rejectButtonStyle = {
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  padding: "5px 10px",
  borderRadius: "4px",
  cursor: "pointer",
};

const popupOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};

const popupStyle = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "10px",
  width: "400px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
};

const cancelButtonStyle = {
  backgroundColor: "#6c757d",
  color: "white",
  border: "none",
  padding: "6px 12px",
  marginRight: "10px",
  borderRadius: "4px",
  cursor: "pointer",
};

const confirmButtonStyle = {
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
};

export default ReceiveGuestRegistrationPage;
