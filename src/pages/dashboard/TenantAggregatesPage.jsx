import React, { useEffect, useState } from "react";
import { colors } from "../../constants/colors";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { FaPrint, FaSave } from "react-icons/fa";
import { listUsers } from "../../services/api/users";
import { listRooms } from "../../services/api/rooms";

export default function TenantAggregatesPage() {
  const [users, setUsers] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [roomData, setRoomData] = useState([]);

  const COLORS = ["#3B82F6", "#F97316", "#10B981", "#A855F7", "#EF4444"];

  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        /* ==================== LOAD USERS ==================== */
        const res = await listUsers();
        setUsers(res);

        // ===== TÍNH GIỚI TÍNH =====
        const genderCounts = { Nam: 0, Nữ: 0, Khác: 0 };
        res.forEach((u) => {
          const gender = (u.gender || "").toLowerCase();
          if (gender === "male" || gender === "nam") genderCounts.Nam++;
          else if (gender === "female" || gender === "nữ") genderCounts.Nữ++;
          else genderCounts.Khác++;
        });

        setGenderData([
          { name: "Nam", value: genderCounts.Nam },
          { name: "Nữ", value: genderCounts.Nữ },
          { name: "Khác", value: genderCounts.Khác },
        ]);

        // ===== TÍNH ĐỘ TUỔI =====
        const ageGroups = { "<18": 0, "18-40": 0, "41-55": 0, ">55": 0 };
        res.forEach((u) => {
          const age = calculateAge(u.birthday);
          if (age == null) return;
          if (age < 18) ageGroups["<18"]++;
          else if (age <= 40) ageGroups["18-40"]++;
          else if (age <= 55) ageGroups["41-55"]++;
          else ageGroups[">55"]++;
        });

        setAgeData([
          { name: "<18", value: ageGroups["<18"] },
          { name: "18-40", value: ageGroups["18-40"] },
          { name: "41-55", value: ageGroups["41-55"] },
          { name: ">55", value: ageGroups[">55"] },
        ]);

        /* ==================== LOAD ROOMS ==================== */
        const rooms = await listRooms();
        const counts = { occupied: 0, available: 0 };
        rooms.forEach((r) => {
          const status = String(r.status || r.room_status || "")
            .trim()
            .toLowerCase();

          if (status === "occupied") counts.occupied++;
          else if (status === "available") counts.available++;
          // ❗ Các status còn lại sẽ bỏ qua — không tính & không hiển thị
        });

        setRoomData([
          { name: "Đang thuê", value: counts.occupied },
          { name: "Còn trống", value: counts.available },
        ]);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: colors.background,
      }}
    >
      {/* ===== HEADER ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontWeight: 700 }}>Thống kê tổng hợp</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              background: "#2563EB",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            <FaPrint /> In
          </button>
          <button
            style={{
              background: "#059669",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            <FaSave /> Lưu
          </button>
        </div>
      </div>

      {/* ===== KHỐI CHÍNH: KHÁCH THUÊ + PHÒNG CÙNG HÀNG ===== */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,.05)",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          gap: 40,
        }}
      >
        {/* ================== KHÁCH THUÊ ================== */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
            Khách thuê trọ ({users.length} người)
          </h3>

          {/* GIỚI TÍNH */}
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div>
              <p style={{ margin: 0, color: "#DC2626" }}>Giới tính:</p>
              {genderData.map((g) => (
                <p key={g.name} style={{ margin: 0 }}>
                  {g.name}: {g.value} người
                </p>
              ))}
            </div>

            <PieChart width={150} height={150}>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
              >
                {genderData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>

          {/* ĐỘ TUỔI */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 40,
              marginTop: 20,
            }}
          >
            <div>
              <p style={{ margin: 0, color: "#DC2626" }}>Độ tuổi:</p>
              {ageData.map((a) => (
                <p key={a.name} style={{ margin: 0 }}>
                  {a.name}: {a.value} người
                </p>
              ))}
            </div>

            <PieChart width={150} height={150}>
              <Pie
                data={ageData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
              >
                {ageData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>

        {/* ================== PHÒNG — đưa lên cùng hàng ================== */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            borderLeft: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ fontWeight: 700 }}>
            Tình trạng phòng ({roomData.reduce((t, r) => t + r.value, 0)} phòng)
          </h3>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              marginTop: 10,
            }}
          >
            <div>
              {roomData.map((r) => (
                <p key={r.name} style={{ margin: 0 }}>
                  {r.name}: {r.value} phòng
                </p>
              ))}
            </div>

            <PieChart width={160} height={160}>
              <Pie
                data={roomData}
                cx="50%"
                cy="50%"
                outerRadius={65}
                dataKey="value"
              >
                {roomData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  );
}
