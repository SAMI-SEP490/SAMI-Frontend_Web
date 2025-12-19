// src/pages/ReceiveGuestRegistrationPage.jsx
import React, { useEffect, useState } from "react";
import {
  listGuestRegistrations,
  approveGuestRegistration,
  rejectGuestRegistration,
} from "../../services/api/guest";
import "./ReceiveGuestRegistrationPage.css";

const STATUS_VN = {
  approved: "Chấp nhận",
  rejected: "Từ chối",
  pending: "Chờ xử lý",
  cancelled: "Đã hủy",
};

export default function ReceiveGuestRegistrationPage() {
  const [guestRegistrations, setGuestRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await listGuestRegistrations();
      const registrations = Array.isArray(res?.registrations)
        ? res.registrations
        : [];
      setGuestRegistrations(registrations);
    } catch (e) {
      console.error(e);
      setGuestRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await approveGuestRegistration(id);
      setGuestRegistrations((prev) =>
        prev.map((i) =>
          i.registration_id === id ? { ...i, status: "approved" } : i
        )
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Lý do từ chối:");
    if (!reason) return;

    try {
      setProcessingId(id);
      await rejectGuestRegistration(id, {
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      });

      setGuestRegistrations((prev) =>
        prev.map((i) =>
          i.registration_id === id
            ? {
                ...i,
                status: "rejected",
                cancellation_reason: reason,
              }
            : i
        )
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = guestRegistrations.filter((item) => {
    const nameMatch =
      item.tenants?.users?.full_name
        ?.toLowerCase()
        .includes(searchName.toLowerCase()) ?? false;

    const statusMatch = filterStatus ? item.status === filterStatus : true;

    return nameMatch && statusMatch;
  });

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
    <div className="container">
      <h2 className="title">Danh sách đăng ký khách</h2>

      {/* FILTER */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔎 Tìm theo tên người gửi..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        <select
          className="status-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="approved">Chấp nhận</option>
          <option value="rejected">Từ chối</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="center">#</th>
              <th>Tên người gửi</th>
              <th className="center">Phòng</th>
              <th className="center">Ngày tạo</th>
              <th className="center">Ngày vào</th>
              <th className="center">Ngày ra</th>
              <th>Thông tin khách</th>
              <th className="center">Trạng thái</th>
              <th className="center action-col">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="center">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.registration_id}>
                  <td className="center">{index + 1}</td>
                  <td>{item.tenants?.users?.full_name || "—"}</td>
                  <td className="center">{item.rooms?.room_number || "—"}</td>
                  <td className="center">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td className="center">
                    {item.arrival_date
                      ? new Date(item.arrival_date).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td className="center">
                    {item.departure_date
                      ? new Date(item.departure_date).toLocaleDateString(
                          "vi-VN"
                        )
                      : "—"}
                  </td>
                  <td>
                    {item.guest_details?.map((g) => (
                      <div key={g.detail_id}>
                        {g.full_name} – {g.id_number}
                      </div>
                    )) || "—"}
                  </td>
                  <td className="center">
                    <span className={`status ${item.status}`}>
                      {STATUS_VN[item.status] || item.status}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {item.status === "pending" && (
                      <>
                        <button
                          className="btn publish"
                          disabled={processingId === item.registration_id}
                          onClick={() => handleApprove(item.registration_id)}
                        >
                          {processingId === item.registration_id
                            ? "..."
                            : "Chấp nhận"}
                        </button>

                        <button
                          className="btn delete"
                          disabled={processingId === item.registration_id}
                          onClick={() => handleReject(item.registration_id)}
                        >
                          {processingId === item.registration_id
                            ? "..."
                            : "Từ chối"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
