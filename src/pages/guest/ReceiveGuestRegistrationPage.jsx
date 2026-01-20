// src/pages/ReceiveGuestRegistrationPage.jsx
import React, { useEffect, useState } from "react";
import {
  listGuestRegistrations,
  approveGuestRegistration,
  rejectGuestRegistration,
} from "../../services/api/guest";
import "./ReceiveGuestRegistrationPage.css";
import { listBuildingsForParking } from "../../services/api/parking-slots";
import { getAccessToken } from "../../services/http";

export default function ReceiveGuestRegistrationPage() {
  const [guestRegistrations, setGuestRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

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
  }, [userRole, filterBuilding]);

  const filtered = guestRegistrations.filter((item) => {
    return (
      item.host?.user?.full_name
        ?.toLowerCase()
        .includes(searchName.toLowerCase()) ?? false
    );
  });

  if (loading) return <p className="loading-text">Đang tải dữ liệu...</p>;

  return (
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
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="center">
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
                      ? new Date(item.arrival_date).toLocaleDateString("vi-VN")
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
