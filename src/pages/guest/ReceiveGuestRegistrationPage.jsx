// src/pages/ReceiveGuestRegistrationPage.jsx
import React, { useEffect, useState } from "react";
import { listGuestRegistrations } from "../../services/api/guest";
import { listBuildingsForParking } from "../../services/api/parking-slots";
import { getAccessToken } from "../../services/http";

export default function ReceiveGuestRegistrationPage() {
  const [guestRegistrations, setGuestRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [filterBuilding, setFilterBuilding] = useState("");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role);

      if (payload.role === "OWNER") {
        listBuildingsForParking().then((res) => {
          setBuildings(res || []);
          if (res?.length > 0) {
            setFilterBuilding(res[0].building_id.toString());
          }
        });
      }
    } catch (err) {
      console.error("❌ Invalid token", err);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = {};
      if (userRole === "OWNER" && filterBuilding) {
        params.building_id = filterBuilding;
      }

      const res = await listGuestRegistrations(params);
      setGuestRegistrations(
        Array.isArray(res?.registrations) ? res.registrations : [],
        Array.isArray(res?.registrations) ? res.registrations : [],
      );
    } catch (e) {
      console.error(e);
      setGuestRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) fetchData();
  }, [userRole, filterStatus, filterBuilding]);

  // const handleApprove = async (id) => {
  //   try {
  //     setProcessingId(id);
  //     await approveGuestRegistration(id);
  //     setGuestRegistrations((prev) =>
  //       prev.map((i) =>
  //         i.registration_id === id ? { ...i, status: "approved" } : i
  //       )
  //     );
  //   } finally {
  //     setProcessingId(null);
  //   }
  // };

  // const handleReject = async (id) => {
  //   const reason = prompt("Lý do từ chối:");
  //   if (!reason) return;

  //   try {
  //     setProcessingId(id);
  //     await rejectGuestRegistration(id, {
  //       cancellation_reason: reason,
  //       cancelled_at: new Date().toISOString(),
  //     });

  //     setGuestRegistrations((prev) =>
  //       prev.map((i) =>
  //         i.registration_id === id
  //           ? {
  //             ...i,
  //             status: "rejected",
  //             cancellation_reason: reason,
  //           }
  //           : i
  //       )
  //     );
  //   } finally {
  //     setProcessingId(null);
  //   }
  // };

  const filtered = guestRegistrations.filter((item) => {
    return (
      item.host?.user?.full_name
        ?.toLowerCase()
        .includes(searchName.toLowerCase()) ?? false
    );
  });

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;
  const pageStyle = `/* ================= CONTAINER ================= */
.container {
  max-width: 1280px;
  margin: 40px auto;
  padding: 28px 32px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

/* ================= TITLE ================= */
.title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title::before {
  content: "";
  width: 6px;
  height: 28px;
  background: linear-gradient(180deg, #2563eb, #1e40af);
  border-radius: 4px;
}

/* ================= FILTER ================= */
.filter-bar {
  display: flex;
  gap: 14px;
  margin-bottom: 22px;
}

.search-input,
.status-select {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus,
.status-select:focus {
  outline: none;
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* ================= TABLE ================= */
.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

thead {
  background: #f1f5f9;
}

th {
  padding: 14px 12px;
  text-align: left;
  font-weight: 600;
  color: #334155;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

td {
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #1f2937;
  vertical-align: middle;
}

tbody tr {
  transition: background 0.15s ease;
}

tbody tr:hover {
  background: #f8fafc;
}

.center {
  text-align: center;
}

/* ================= STATUS ================= */
.status {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.status.approved {
  background: #dcfce7;
  color: #166534;
}

.status.pending {
  background: #fef9c3;
  color: #854d0e;
}

.status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status.cancelled,
.status.expired {
  background: #e5e7eb;
  color: #374151;
}

/* ================= ACTION ================= */
.action-col {
  min-width: 190px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.btn {
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn.publish {
  background: #22c55e;
  color: #ffffff;
}

.btn.publish:hover {
  background: #16a34a;
}

.btn.delete {
  background: #ef4444;
  color: #ffffff;
}

.btn.delete:hover {
  background: #dc2626;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================= EMPTY / LOADING ================= */
.loading-text {
  text-align: center;
  padding: 48px;
  font-size: 15px;
  color: #64748b;
}
  th:nth-child(1),
td:nth-child(1),
th:nth-child(2),
td:nth-child(2),
th:nth-child(3),
td:nth-child(3),
th:nth-child(4),
td:nth-child(4),
th:nth-child(5),
td:nth-child(5),
th:nth-child(6),
td:nth-child(6) {
  text-align: center;
}
`;
  return (
    <>
      <style>{pageStyle}</style>
      <div className="container">
        <h2 className="title">Danh sách đăng ký khách</h2>

        {/* FILTER */}
        <div className="filter-bar">
          <input
            className="search-input"
            placeholder="Tìm theo tên người gửi..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />

          <select
            className="status-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="approved">Chấp nhận</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          {userRole === "OWNER" && (
            <select
              className="status-select"
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
            >
              {buildings.map((b) => (
                <option key={b.building_id} value={b.building_id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
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
                    <td>{item.host?.user?.full_name || "—"}</td>
                    <td className="center">{item.room?.room_number || "—"}</td>
                    <td className="center">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="center">
                      {item.arrival_date
                        ? new Date(item.arrival_date).toLocaleDateString(
                            "vi-VN",
                          )
                        : "—"}
                    </td>
                    <td className="center">
                      {item.departure_date
                        ? new Date(item.departure_date).toLocaleDateString(
                            "vi-VN",
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
