import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createParkingSlot,
  listBuildingsForParking,
} from "../../services/api/parking-slots";
import { getAccessToken } from "../../services/http";
import "./CreateParkingSlotPage.css";

export default function CreateParkingSlotPage() {
  const navigate = useNavigate();

  /* ================= AUTH ================= */
  const [role, setRole] = useState("");
  const [userBuildingId, setUserBuildingId] = useState(null);

  /* ================= DATA ================= */
  const [buildings, setBuildings] = useState([]);

  /* ================= FORM ================= */
  const [buildingId, setBuildingId] = useState("");
  const [slotNumber, setSlotNumber] = useState("");
  const [slotType, setSlotType] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= GET ROLE ================= */
 useEffect(() => {
  try {
    const token = getAccessToken();
    if (!token) return;

    const decoded = JSON.parse(atob(token.split(".")[1]));
    setRole((decoded.role || "").toUpperCase());
  } catch (e) {
    console.error(e);
  }
}, []);
  /* ================= LOAD BUILDINGS ================= */
 useEffect(() => {
  async function loadBuildings() {
    const res = await listBuildingsForParking();

    setBuildings(res || []);

    // MANAGER → auto select
    if (role === "MANAGER" && res?.length === 1) {
      setBuildingId(res[0].building_id);
    }
  }

  if (role) loadBuildings();
}, [role]);

  /* ================= SUBMIT ================= */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!buildingId || !slotNumber || !slotType) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setLoading(true);

      await createParkingSlot({
        building_id: Number(buildingId),
        slot_number: slotNumber.trim(),
        slot_type: slotType,
      });

      alert("✅ Tạo chỗ đỗ thành công!");
      navigate("/parking-slots");
    } catch (err) {
      console.error(err);

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "❌ Tạo chỗ đỗ thất bại.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h2 className="title">➕ Thêm Chỗ Đỗ Xe</h2>

      <form className="form-box" onSubmit={handleSubmit}>
        {/* BUILDING */}
        {role === "OWNER" && (
          <div className="form-group">
            <label>Tòa nhà</label>
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(Number(e.target.value))}
            >
              <option value="">-- Chọn tòa nhà --</option>
              {buildings.map((b) => (
                <option key={b.building_id} value={b.building_id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {role === "MANAGER" && (
  <div className="form-group">
    <label>Tòa nhà</label>
    <input
      type="text"
      value={buildings[0]?.name || "Đang tải tòa nhà..."}
      disabled
    />
  </div>
)}

        {/* SLOT NUMBER */}
        <div className="form-group">
          <label>Mã chỗ đỗ</label>
          <input
            type="text"
            placeholder="VD: A01, B12..."
            value={slotNumber}
            onChange={(e) => setSlotNumber(e.target.value)}
          />
        </div>

        {/* SLOT TYPE */}
        <div className="form-group">
          <label>Loại xe</label>
          <select
            value={slotType}
            onChange={(e) => setSlotType(e.target.value)}
          >
            <option value="">-- Chọn loại xe --</option>
            <option value="two_wheeler">Xe máy</option>
            <option value="four_wheeler">Ô tô</option>
          </select>
        </div>

        {/* ERROR */}
        {error && <p className="error-text">{error}</p>}

        {/* ACTION */}
        <div className="form-actions">
          <button
            type="button"
            className="btn cancel"
            onClick={() => navigate("/parking-slots")}
          >
            Hủy
          </button>

          <button type="submit" className="btn add" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo chỗ đỗ"}
          </button>
        </div>
      </form>
    </div>
  );
}
