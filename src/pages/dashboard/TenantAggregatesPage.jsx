import React, { useEffect, useState } from "react";
import { colors } from "../../constants/colors";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { listUsers } from "../../services/api/users";
import { listRooms } from "../../services/api/rooms";

export default function TenantAggregatesPage() {
  const [users, setUsers] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [tenantData, setTenantData] = useState([]);
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
        /* ==================== USERS ==================== */
        const userRes = await listUsers();
        setUsers(userRes);

        /* ===== GIỚI TÍNH ===== */
        const genderCounts = { Nam: 0, Nữ: 0, Khác: 0 };
        userRes.forEach((u) => {
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

        /* ===== ĐỘ TUỔI ===== */
        const ageGroups = { "<18": 0, "18-40": 0, "41-55": 0, ">55": 0 };
        userRes.forEach((u) => {
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

        /* ===== NGƯỜI THUÊ ===== */
        let tenantCount = 0;
        let otherCount = 0;
        userRes.forEach((u) => {
          if (u.role === "TENANT") tenantCount++;
          else otherCount++;
        });

        setTenantData([
          { name: "Người thuê", value: tenantCount },
          { name: "Khác", value: otherCount },
        ]);

        /* ==================== ROOMS ==================== */
        const roomRes = await listRooms();
        const roomCounts = { occupied: 0, available: 0 };

        roomRes.forEach((r) => {
          const status = String(r.status || r.room_status || "")
            .trim()
            .toLowerCase();
          if (status === "occupied") roomCounts.occupied++;
          else if (status === "available") roomCounts.available++;
        });

        setRoomData([
          { name: "Đang thuê", value: roomCounts.occupied },
          { name: "Còn trống", value: roomCounts.available },
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
        padding: 24,
        background: colors.background,
      }}
    >
      <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Thống kê tổng hợp</h2>

      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,.05)",
          padding: "20px 24px",
          display: "flex",
          gap: 40,
        }}
      >
        {/* ================== NGƯỜI DÙNG ================== */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700 }}>Người dùng ({users.length} người)</h3>

          {/* GIỚI TÍNH */}
          <Section title="Giới tính" data={genderData} colors={COLORS} />

          {/* ĐỘ TUỔI */}
          <Section title="Độ tuổi" data={ageData} colors={COLORS} />

          {/* NGƯỜI THUÊ */}
          <Section title="Người thuê" data={tenantData} colors={COLORS} />
        </div>

        {/* ================== PHÒNG ================== */}
        <div
          style={{
            flex: 1,
            paddingLeft: 24,
            borderLeft: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ fontWeight: 700 }}>
            Tình trạng phòng ({roomData.reduce((t, r) => t + r.value, 0)} phòng)
          </h3>

          <Section data={roomData} colors={COLORS} size={160} />
        </div>
      </div>
    </div>
  );
}

/* ================== COMPONENT CON ================== */
function Section({ title, data, colors, size = 150 }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 40,
        marginTop: 20,
      }}
    >
      <div>
        {title && <p style={{ margin: 0, color: "#DC2626" }}>{title}:</p>}
        {data.map((d) => (
          <p key={d.name} style={{ margin: 0 }}>
            {d.name}: {d.value}
          </p>
        ))}
      </div>

      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={size / 2 - 15}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
}
