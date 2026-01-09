import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  registerUser,
  changeToTenant,
  changeToManager,
} from "../../services/api/users";
import { listBuildings } from "../../services/api/building";
import { listRoomsLite } from "../../services/api/rooms";
import { colors } from "../../constants/colors";

/** convert yyyy-mm-dd → ISO */
const toISO = (d) => (d ? new Date(d).toISOString() : undefined);

export default function UserCreatePage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [userId, setUserId] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);

  /** USER */
  const [userForm, setUserForm] = useState({
    full_name: "",
    gender: "",
    birthday: "",
    phone: "",
    email: "",
    password: "",
  });

  /** TENANT */
 const [tenantForm, setTenantForm] = useState({
  buildingId: "",
  roomId: "",
  idNumber: "",
  note: "",
});

  /** MANAGER */
const [managerForm, setManagerForm] = useState({
  buildingId: "",
  note: "",
});

  /** load data step 3 */
  useEffect(() => {
    if (step !== 3) return;

    if (role === "tenant") {
      listBuildings().then(setBuildings).catch(() => setBuildings([]));
    }

    if (role === "manager") {
      listBuildings().then(setBuildings).catch(() => setBuildings([]));
    }
  }, [step, role]);
useEffect(() => {
  if (!tenantForm.buildingId) return;

  listRoomsLite({ buildingId: tenantForm.buildingId })
    .then(setRooms)
    .catch(() => setRooms([]));
}, [tenantForm.buildingId]);
  /** STEP 2 */
  const submitUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      const u = await registerUser(userForm);
      setUserId(u?.id || u?.user_id);
      setStep(3);
    } catch (e) {
      setErr(e?.response?.data?.message || "Tạo user thất bại");
    } finally {
      setSaving(false);
    }
  };

  /** STEP 3 */
const submitRole = async (e) => {
  e.preventDefault();
  setSaving(true);
  setErr("");

  try {
    if (!userId) throw new Error("User chưa được tạo");

    // TENANT
    if (role === "tenant") {
      if (!tenantForm.roomId) {
        throw new Error("Chưa chọn phòng");
      }

      await changeToTenant({
        userId: Number(userId),
        roomId: Number(tenantForm.roomId),
        idNumber: tenantForm.idNumber,
        note: tenantForm.note || null,
      });
    }

    // MANAGER
    if (role === "manager") {
      if (!managerForm.buildingId) {
        throw new Error("Chưa chọn tòa nhà");
      }

      await changeToManager({
        userId: Number(userId),
        buildingId: Number(managerForm.buildingId),
        note: managerForm.note || null,
      });
    }

    alert("Tạo người dùng thành công");
    navigate("/users");
  } catch (e) {
    console.error(e);
    setErr(e?.response?.data?.message || e.message || "Gán vai trò thất bại");
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="page">
      <style>{`
        .page{
          min-height:calc(100vh - 80px);
          display:flex;
          justify-content:center;
          align-items:flex-start;
          background:#f8fafc;
          padding-top:40px;
        }
        .card{
          width:420px;
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:14px;
          padding:24px;
        }
        h1{text-align:center;margin-bottom:20px}
        .error{
          background:#fee2e2;
          color:#991b1b;
          padding:8px 12px;
          border-radius:8px;
          margin-bottom:12px;
          font-size:14px;
        }
        .roles{
          display:flex;
          gap:12px;
          margin-bottom:20px;
        }
        .role{
          flex:1;
          padding:14px;
          text-align:center;
          border-radius:12px;
          border:1px solid #cbd5e1;
          cursor:pointer;
          font-weight:600;
        }
        .role.active{
          border-color:${colors.brand};
          color:${colors.brand};
          background:#f0f9ff;
        }
        .field{margin-bottom:14px}
        .field label{
          display:block;
          font-size:13px;
          color:#475569;
          margin-bottom:4px;
        }
        input,select{
          width:100%;
          height:38px;
          border-radius:8px;
          border:1px solid #cbd5e1;
          padding:0 10px;
        }
        .actions{
          display:flex;
          gap:10px;
          justify-content:flex-end;
          margin-top:18px;
        }
        .btn{
          height:38px;
          padding:0 18px;
          border-radius:8px;
          border:none;
          font-weight:600;
          cursor:pointer;
        }
        .btn-primary{
          background:${colors.brand};
          color:#fff;
        }
        .btn-secondary{
          background:#e5e7eb;
        }
      `}</style>

      <div className="card">
        <h1>Tạo người dùng</h1>
        {err && <div className="error">{err}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div className="roles">
              <div
                className={`role ${role === "tenant" ? "active" : ""}`}
                onClick={() => setRole("tenant")}
              >
                Người thuê
              </div>
              <div
                className={`role ${role === "manager" ? "active" : ""}`}
                onClick={() => setRole("manager")}
              >
                Quản lý
              </div>
            </div>

            <div className="actions">
              <button
                className="btn btn-primary"
                disabled={!role}
                onClick={() => setStep(2)}
              >
                Tiếp tục
              </button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={submitUser}>
            <div className="field">
              <label>Họ tên</label>
              <input
                value={userForm.full_name}
                onChange={(e) =>
                  setUserForm({ ...userForm, full_name: e.target.value })
                }
                required
              />
            </div>

            <div className="field">
              <label>Giới tính</label>
              <select
                value={userForm.gender}
                onChange={(e) =>
                  setUserForm({ ...userForm, gender: e.target.value })
                }
                required
              >
                <option value="">-- Chọn --</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>

            <div className="field">
              <label>Ngày sinh</label>
              <input
                type="date"
                value={userForm.birthday}
                onChange={(e) =>
                  setUserForm({ ...userForm, birthday: e.target.value })
                }
                required
              />
            </div>

            <div className="field">
              <label>Số điện thoại</label>
              <input
                value={userForm.phone}
                onChange={(e) =>
                  setUserForm({ ...userForm, phone: e.target.value })
                }
                required
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                required
              />
            </div>

            <div className="field">
              <label>Mật khẩu</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                minLength={8}
                required
              />
            </div>

            <div className="actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                Quay lại
              </button>
              <button className="btn btn-primary">
                {saving ? "Đang tạo..." : "Tiếp tục"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={submitRole}>
            {role === "tenant" && (
  <>
    <div className="field">
      <label>Tòa nhà</label>
      <select
        value={tenantForm.buildingId}
        onChange={(e) =>
          setTenantForm({
            ...tenantForm,
            buildingId: e.target.value,
            roomId: "", // reset phòng khi đổi building
          })
        }
        required
      >
        <option value="">-- Chọn tòa nhà --</option>
        {buildings.map((b) => (
          <option key={b.building_id} value={b.building_id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>

    <div className="field">
      <label>Phòng</label>
      <select
        value={tenantForm.roomId}
        onChange={(e) =>
          setTenantForm({ ...tenantForm, roomId: e.target.value })
        }
        disabled={!tenantForm.buildingId}
        required
      >
        <option value="">-- Chọn phòng --</option>
        {rooms.map((r) => {
  const id = r.room_id ?? r.id ?? r.roomId;
  const number = r.room_number ?? r.number ?? r.roomNo;

  return (
    <option key={id} value={id}>
      {number || `Phòng #${id}`}
    </option>
  );
})}
      </select>
    </div>

    <div className="field">
      <label>CCCD / CMND</label>
      <input
        value={tenantForm.idNumber}
        onChange={(e) =>
          setTenantForm({ ...tenantForm, idNumber: e.target.value })
        }
        required
      />
    </div>

    <div className="field">
      <label>Ghi chú</label>
      <input
        value={tenantForm.note}
        onChange={(e) =>
          setTenantForm({ ...tenantForm, note: e.target.value })
        }
      />
    </div>
  </>
)}

            {role === "manager" && (
              <>
                <div className="field">
                  <label>Tòa nhà</label>
                  <select
  value={managerForm.buildingId}
  onChange={(e) =>
    setManagerForm({ ...managerForm, buildingId: e.target.value })
  }
  required
>
  <option value="">-- Chọn tòa nhà --</option>

  {buildings.map((b) => {
    const id = b.id ?? b.building_id;

    return (
      <option key={id} value={id}>
        {b.name || `Tòa nhà #${id}`}
      </option>
    );
  })}
</select>
                </div>
                <div className="field">
                  <label>Ghi chú</label>
                  <input
                    value={managerForm.note}
                    onChange={(e) =>
                      setManagerForm({ ...managerForm, note: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div className="actions">
              <button className="btn btn-primary">
                {saving ? "Đang lưu..." : "Hoàn tất"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
