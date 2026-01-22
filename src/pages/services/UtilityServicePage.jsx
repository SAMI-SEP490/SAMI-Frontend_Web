import React, { useEffect, useMemo, useState } from "react";
import {
  listBuildings,
  getBuildingManagers,
} from "../../services/api/building";
import {
  getUtilityReadingsForm,
  submitUtilityReadings,
} from "../../services/api/utility";
import { FiAlertTriangle, FiClock, FiSave, FiRotateCcw } from "react-icons/fi";
import "./UtilityServicePage.css";

// Helper format datetime
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function UtilityServicePage() {
  const user = JSON.parse(localStorage.getItem("sami:user") || "{}");
  const role = user?.role;
  const userId = user?.user_id || user?.id;

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // --- STATE ---
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [rooms, setRooms] = useState([]);
  const [originalRooms, setOriginalRooms] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editModeOld, setEditModeOld] = useState(false);

  // --- LOAD BUILDINGS ---
  useEffect(() => {
    async function load() {
      try {
        const all = await listBuildings();
        let allowed = [];

        if (role === "OWNER") {
          allowed = all;
        } else {
          for (const b of all) {
            try {
              const mgrs = await getBuildingManagers(b.building_id);
              if (mgrs.some((m) => Number(m.user_id) === Number(userId))) {
                allowed.push(b);
              }
            } catch {}
          }
        }

        setBuildings(allowed);
        if (allowed.length > 0) {
          setSelectedBuildingId(allowed[0].building_id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [role, userId]);

  // --- LOAD READINGS ---
  useEffect(() => {
    if (!selectedBuildingId) return;

    async function fetchReadings() {
      setLoading(true);
      try {
        const res = await getUtilityReadingsForm({
          building_id: selectedBuildingId,
          month,
          year,
        });

        const mapped = (res || []).map((r) => ({
          ...r,
          new_electric: r.new_electric ?? r.old_electric,
          new_water: r.new_water ?? r.old_water,
          old_electric_original: r.old_electric,
          old_water_original: r.old_water,
        }));

        setRooms(mapped);
        setOriginalRooms(JSON.parse(JSON.stringify(mapped)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchReadings();
  }, [selectedBuildingId, month, year]);

  // ================= LOGIC =================

  // 1. Tháng tương lai
  const isFuture = useMemo(() => {
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  }, [month, year, currentMonth, currentYear]);

  // 2. Tháng quá khứ
  const isPastMonth = useMemo(() => {
    if (year < currentYear) return true;
    if (year === currentYear && month < currentMonth) return true;
    return false;
  }, [month, year, currentMonth, currentYear]);

  // 3. Sau ngày chốt sổ
  const isAfterClosingDay = useMemo(() => {
    const building = buildings.find(
      (b) => b.building_id === Number(selectedBuildingId),
    );
    if (!building || !building.bill_closing_day) return false;

    if (month !== currentMonth || year !== currentYear) return false;

    return today.getDate() > building.bill_closing_day;
  }, [buildings, selectedBuildingId, month, year, currentMonth, currentYear]);

  // 4. Có được sửa không
  const isEditable = !isFuture && !isPastMonth && !isAfterClosingDay;

  // 5. Auto jump sang tháng sau sau closing day
  useEffect(() => {
    const building = buildings.find(
      (b) => b.building_id === Number(selectedBuildingId),
    );
    if (!building || !building.bill_closing_day) return;

    if (
      month === currentMonth &&
      year === currentYear &&
      today.getDate() > building.bill_closing_day
    ) {
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;

      if (nextMonth === 13) {
        nextMonth = 1;
        nextYear += 1;
      }

      setMonth(nextMonth);
      setYear(nextYear);
    }
  }, [buildings, selectedBuildingId]);

  // 6. Deadline badge
  const deadlineInfo = useMemo(() => {
    const building = buildings.find(
      (b) => b.building_id === Number(selectedBuildingId),
    );
    if (!building || !building.bill_closing_day) return null;

    if (month !== currentMonth || year !== currentYear) return null;

    const closingDay = building.bill_closing_day;
    const deadlineDate = new Date(year, month - 1, closingDay, 23, 30);
    const diffMs = deadlineDate - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffMs < 0) {
      return {
        status: "overdue",
        text: `Đã quá hạn chốt sổ (${closingDay}/${month})`,
      };
    }

    if (diffDays <= 3) {
      return {
        status: "warning",
        text: `Sắp đến hạn chốt sổ! Còn ${diffDays > 1 ? diffDays + " ngày" : diffHours + " giờ"}`,
      };
    }

    return null;
  }, [buildings, selectedBuildingId, month, year, currentMonth, currentYear]);

  // ================= HANDLERS =================

  const handleChange = (roomId, field, value) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.room_id === roomId ? { ...r, [field]: Number(value) } : r,
      ),
    );
  };

  const handleSave = async () => {
    const invalid = rooms.some(
      (r) => r.new_electric < r.old_electric || r.new_water < r.old_water,
    );
    if (invalid) return alert("Chỉ số mới không được nhỏ hơn chỉ số cũ!");

    setSaving(true);
    try {
      const payload = {
        building_id: selectedBuildingId,
        billing_month: month,
        billing_year: year,
        readings: rooms.map((r) => {
          const item = {
            room_id: r.room_id,
            new_electric: r.new_electric,
            new_water: r.new_water,
          };

          if (r.old_electric !== r.old_electric_original) {
            item.old_electric_override = r.old_electric;
            item.is_electric_reset = true;
          }

          if (r.old_water !== r.old_water_original) {
            item.old_water_override = r.old_water;
            item.is_water_reset = true;
          }

          return item;
        }),
      };

      await submitUtilityReadings(payload);
      alert("✅ Lưu thành công!");
      setOriginalRooms(JSON.parse(JSON.stringify(rooms)));
      setEditModeOld(false);
    } catch (e) {
      alert("❌ Lỗi lưu dữ liệu");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.room_number.toLowerCase().includes(search.toLowerCase()),
  );
  const hasChanged = JSON.stringify(rooms) !== JSON.stringify(originalRooms);

  // ================= RENDER =================

  return (
    <div className="container utility-page">
      <div className="header-row">
        <h2 className="title">Chốt Điện Nước</h2>

        {deadlineInfo && (
          <div className={`deadline-badge ${deadlineInfo.status}`}>
            <FiAlertTriangle size={18} />
            <span>{deadlineInfo.text}</span>
          </div>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        {role === "OWNER" && (
          <div className="filter-item">
            <label>Tòa nhà</label>
            <select
              className="filter-input"
              value={selectedBuildingId || ""}
              onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
            >
              {buildings.map((b) => (
                <option key={b.building_id} value={b.building_id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-item date-group">
          <label>Kỳ chốt sổ</label>
          <div className="d-flex gap-2">
            <select
              className="filter-input"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="filter-input"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ width: 80 }}
            />
          </div>
        </div>

        <div className="filter-item flex-grow">
          <label>Tìm phòng</label>
          <input
            className="filter-input"
            placeholder="Số phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="actions-row">
        <button
          className={`btn-secondary ${editModeOld ? "active" : ""}`}
          onClick={() => setEditModeOld(!editModeOld)}
          hidden={!isEditable}
        >
          <FiRotateCcw /> {editModeOld ? "Đang sửa số cũ" : "Báo thay công tơ"}
        </button>

        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!hasChanged || saving || !isEditable}
        >
          {saving ? (
            "Đang lưu..."
          ) : (
            <>
              <FiSave /> Lưu thay đổi
            </>
          )}
        </button>
      </div>

      {/* TABLE */}
      {isFuture ? (
        <div className="no-data">⏳ Không thể nhập liệu cho tương lai.</div>
      ) : loading ? (
        <div className="loading-text">Đang tải dữ liệu...</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="center">Phòng</th>
                <th className="center text-warning">Điện Cũ</th>
                <th className="center text-warning">Điện Mới</th>
                <th className="center text-info">Nước Cũ</th>
                <th className="center text-info">Nước Mới</th>
                <th className="center">Cập nhật cuối</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((r) => (
                <tr key={r.room_id}>
                  <td className="center fw-bold">{r.room_number}</td>

                  <td>
                    <input
                      type="number"
                      className="table-input text-end"
                      value={r.old_electric}
                      disabled
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      className="table-input text-end fw-bold"
                      value={r.new_electric}
                      disabled={!isEditable}
                      onChange={(e) =>
                        handleChange(r.room_id, "new_electric", e.target.value)
                      }
                    />
                    <div className="diff-badge">
                      +{r.new_electric - r.old_electric}
                    </div>
                  </td>

                  <td>
                    <input
                      type="number"
                      className="table-input text-end"
                      value={r.old_water}
                      disabled
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      className="table-input text-end fw-bold"
                      value={r.new_water}
                      disabled={!isEditable}
                      onChange={(e) =>
                        handleChange(r.room_id, "new_water", e.target.value)
                      }
                    />
                    <div className="diff-badge">
                      +{r.new_water - r.old_water}
                    </div>
                  </td>

                  <td className="center small text-muted">
                    {r.recorded_date ? (
                      <>
                        <FiClock size={12} className="me-1" />
                        {fmtDate(r.recorded_date)}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRooms.length === 0 && (
            <div className="no-data">Không có phòng nào.</div>
          )}
        </div>
      )}
    </div>
  );
}
