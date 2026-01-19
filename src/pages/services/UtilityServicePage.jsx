// src/pages/services/UtilityServicePage.js
// Enforce bill_due_day edit rules + allow view all months + highlight editable period

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  listBuildings,
  getBuildingManagers,
} from "../../services/api/building";
import {
  getUtilityReadingsForm,
  submitUtilityReadings,
} from "../../services/api/utility";
import "./UtilityServicePage.css";

export default function UtilityServicePage() {
  // ================= USER =================
  const user = JSON.parse(localStorage.getItem("sami:user"));
  const role = user?.role;
  const userId = user?.id;

  const today = new Date();
  const didAutoJump = useRef(false);

  // ================= STATE =================
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [rooms, setRooms] = useState([]);
  const [originalRooms, setOriginalRooms] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ================= HELPERS =================
  const daysInMonth = (m, y) => new Date(y, m, 0).getDate();

  const addMonth = (m, y) =>
    m === 12 ? { month: 1, year: y + 1 } : { month: m + 1, year: y };

  // ================= DERIVED =================
  const billDueDay = useMemo(() => {
    return buildings.find(
      (b) => Number(b.building_id) === Number(selectedBuildingId)
    )?.bill_due_day;
  }, [buildings, selectedBuildingId]);

  /**
   * THÁNG DUY NHẤT ĐƯỢC PHÉP SỬA
   */
  const editablePeriod = useMemo(() => {
    if (!billDueDay) return null;

    const maxDay = daysInMonth(today.getMonth() + 1, today.getFullYear());
    const effectiveDueDay = Math.min(billDueDay, maxDay);

    const dueDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      effectiveDueDay,
      0,
      0,
      0
    );

    // Trước ngày chốt → sửa tháng hiện tại
    if (today < dueDate) {
      return {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      };
    }

    // Từ ngày chốt → sửa tháng tiếp theo
    return addMonth(today.getMonth() + 1, today.getFullYear());
  }, [billDueDay]);

  /**
   * Có được sửa tháng đang xem không
   */
  const canEdit = useMemo(() => {
    if (!editablePeriod) return false;
    return (
      Number(month) === Number(editablePeriod.month) &&
      Number(year) === Number(editablePeriod.year)
    );
  }, [month, year, editablePeriod]);

  const hasChanged = useMemo(() => {
    if (rooms.length !== originalRooms.length) return false;
    return rooms.some(
      (r, idx) =>
        r.new_electric !== originalRooms[idx]?.new_electric ||
        r.new_water !== originalRooms[idx]?.new_water
    );
  }, [rooms, originalRooms]);

  // ================= AUTO JUMP (CHỈ 1 LẦN) =================
  useEffect(() => {
    if (!editablePeriod || didAutoJump.current) return;
    setMonth(editablePeriod.month);
    setYear(editablePeriod.year);
    didAutoJump.current = true;
  }, [editablePeriod]);

  // ================= LOAD BUILDINGS =================
  useEffect(() => {
    async function loadBuildings() {
      try {
        const all = await listBuildings();

        if (role === "OWNER") {
          setBuildings(all);
          if (all.length) setSelectedBuildingId(all[0].building_id);
          return;
        }

        const allowed = [];
        for (const b of all) {
          const managers = await getBuildingManagers(b.building_id);
          if (managers.some((m) => Number(m.user_id) === Number(userId))) {
            allowed.push(b);
          }
        }

        setBuildings(allowed);
        if (allowed.length) setSelectedBuildingId(allowed[0].building_id);
      } catch (err) {
        console.error(err);
      }
    }

    loadBuildings();
  }, [role, userId]);

  // ================= LOAD READINGS =================
  useEffect(() => {
    if (!selectedBuildingId) return;

    async function loadReadings() {
      setLoading(true);
      try {
        const formData = await getUtilityReadingsForm({
          building_id: selectedBuildingId,
          month,
          year,
        });

        const mapped = formData.map((r) => ({
          ...r,
          new_electric: r.new_electric ?? r.old_electric,
          new_water: r.new_water ?? r.old_water,
        }));

        setRooms(mapped);
        setOriginalRooms(JSON.parse(JSON.stringify(mapped)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadReadings();
  }, [selectedBuildingId, month, year]);

  // ================= EVENTS =================
  const handleChange = (roomId, field, value) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.room_id === roomId ? { ...r, [field]: Number(value) } : r
      )
    );
  };

  const handleSave = async () => {
    const invalid = rooms.some(
      (r) => r.new_electric < r.old_electric || r.new_water < r.old_water
    );
    if (invalid) {
      alert("Chỉ số mới không được nhỏ hơn chỉ số cũ");
      return;
    }

    setSaving(true);
    try {
      await submitUtilityReadings({
        building_id: selectedBuildingId,
        billing_month: month,
        billing_year: year,
        readings: rooms.map((r) => ({
          room_id: r.room_id,
          new_electric: r.new_electric,
          new_water: r.new_water,
        })),
      });

      setOriginalRooms(JSON.parse(JSON.stringify(rooms)));
      alert("Lưu chỉ số thành công");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu chỉ số");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRooms(JSON.parse(JSON.stringify(originalRooms)));
  };

  // ================= FILTER =================
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) =>
      r.room_number.toLowerCase().includes(search.toLowerCase())
    );
  }, [rooms, search]);

  // ================= RENDER =================
  return (
    <div className="container">
      <h2 className="title">Quản lý dịch vụ điện nước</h2>

      {/* BILL INFO */}
      {billDueDay && (
        <div className="bill-due-box">
          📅 Ngày chốt điện nước: <b>ngày {billDueDay}</b> hằng tháng <br />
          👉 Tháng được phép nhập:{" "}
          <b>
            {editablePeriod?.month}/{editablePeriod?.year}
          </b>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="filter-bar">
        {role === "OWNER" && (
          <div className="filter-item">
            <label className="filter-label">Tòa nhà</label>
            <select
              value={selectedBuildingId || ""}
              onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
              className="status-select"
            >
              {buildings.map((b) => (
                <option key={b.building_id} value={b.building_id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-item">
          <label className="filter-label">Tháng</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="search-input"
          />
        </div>

        <div className="filter-item">
          <label className="filter-label">Năm</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="search-input"
          />
        </div>

        <div className="filter-item flex-grow">
          <label className="filter-label">Tìm phòng</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* READONLY HINT */}
      {!canEdit && (
        <div className="readonly-hint">
          🔒 Tháng {month}/{year} chỉ cho phép xem. Tháng được nhập hiện tại là{" "}
          <b>
            {editablePeriod?.month}/{editablePeriod?.year}
          </b>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <p className="loading-text">Đang tải dữ liệu...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Điện cũ</th>
                <th>Điện mới</th>
                <th>Nước cũ</th>
                <th>Nước mới</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((r) => (
                <tr key={r.room_id}>
                  <td>{r.room_number}</td>
                  <td>{r.old_electric}</td>
                  <td>
                    <input
                      type="number"
                      value={r.new_electric}
                      disabled={!canEdit}
                      onChange={(e) =>
                        handleChange(r.room_id, "new_electric", e.target.value)
                      }
                      className="table-input"
                    />
                  </td>
                  <td>{r.old_water}</td>
                  <td>
                    <input
                      type="number"
                      value={r.new_water}
                      disabled={!canEdit}
                      onChange={(e) =>
                        handleChange(r.room_id, "new_water", e.target.value)
                      }
                      className="table-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRooms.length === 0 && (
            <p className="no-data">Không có phòng nào</p>
          )}
        </div>
      )}

      {/* ACTION */}
      <div className="action-buttons bottom">
        <button
          className="btn add"
          disabled={!hasChanged || saving || !canEdit}
          onClick={handleSave}
        >
          💾 Lưu
        </button>

        <button
          className="btn delete"
          disabled={!hasChanged}
          onClick={handleCancel}
        >
          ↩ Hủy
        </button>
      </div>
    </div>
  );
}
