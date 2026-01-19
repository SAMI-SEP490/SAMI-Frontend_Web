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
const pageStyle = `/* ================= ROOT ================= */
:root {
  --primary: #2563eb;
  --primary-light: #dbeafe;
  --danger: #dc2626;
  --text-main: #111827;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --bg: #f9fafb;
}

/* ================= PAGE ================= */
.container {
  max-width: 460px;   
  margin: 60px auto;
  padding: 28px 28px 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

/* ================= TITLE ================= */
.title {
  font-size: 22px;
  font-weight: 700;
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 20px;
}

/* ================= FORM ================= */
.form-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

/* ================= INPUT / SELECT ================= */
.form-group input,
.form-group select {
  height: 44px;
  padding: 0 14px;
  font-size: 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

/* Disabled (MANAGER building) */
.form-group input:disabled {
  background: #f3f4f6;
  color: #374151;
  cursor: not-allowed;
}

/* ================= ERROR ================= */
.error-text {
  font-size: 13px;
  color: var(--danger);
  background: #fee2e2;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

/* ================= ACTIONS ================= */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

/* ================= BUTTON ================= */
.btn {
  min-width: 110px;
  height: 42px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Cancel */
.btn.cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn.cancel:hover {
  background: #e5e7eb;
}

/* Add */
.btn.add {
  background: var(--primary);
  color: #ffffff;
}

.btn.add:hover {
  background: #1d4ed8;
}

.btn.add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
`
  return (
<>   
<style>{pageStyle}</style>
    <div className="container">
      <h2 className="title"> Thêm Chỗ Đỗ Xe</h2>

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
            <option value="two_wheeler">Xe 2 bánh</option>
            <option value="four_wheeler">Xe 4 bánh</option>
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
    </> 
  );
}
