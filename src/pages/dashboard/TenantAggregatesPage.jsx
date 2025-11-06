import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { FaPrint, FaSave } from "react-icons/fa";
import { listUsers } from "../../services/api/users"; // ✅ gọi API

export default function TenantAggregatesPage() {
  const [users, setUsers] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [ageData, setAgeData] = useState([]);

  const COLORS = ["#3B82F6", "#F97316", "#10B981", "#A855F7"];

  // 🧮 Hàm tính tuổi từ ngày sinh
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // 🧭 Gọi API lấy danh sách user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await listUsers();
        setUsers(res);

        // --- Thống kê giới tính ---
        const genderCounts = { Nam: 0, Nữ: 0, Khác: 0 };
        res.forEach((u) => {
          const gender = (u.gender || "").toLowerCase();
          if (gender === "male" || gender == "nam") genderCounts.Nam++;
          else if (gender === "female" || gender == "nữ") genderCounts.Nữ++;
          else genderCounts.Khác++;
        });

        setGenderData([
          { name: "Nam", value: genderCounts.Nam },
          { name: "Nữ", value: genderCounts.Nữ },
          { name: "Khác", value: genderCounts.Khác },
        ]);

        // --- Thống kê độ tuổi (dựa vào birthday) ---
        const ageGroups = { "<18": 0, "18-40": 0, "41-55": 0, ">55": 0 };
        res.forEach((u) => {
          const age = calculateAge(u.birthday);
          if (age == null || isNaN(age)) return;
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
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách người dùng:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 10,
          borderRadius: "10px",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Header />
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "220px",
            backgroundColor: colors.brand,
            color: "white",
            height: "100%",
            position: "sticky",
            top: 0,
            borderRadius: "10px",
          }}
        >
          <Sidebar />
        </div>

        {/* Nội dung chính */}
        <div
          style={{
            flex: 1,
            background: colors.background,
            padding: "24px",
            overflowY: "auto",
          }}
        >
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

          {/* Khối thống kê */}
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              padding: "20px 24px",
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
              Khách thuê trọ ({users.length} người)
            </h3>

            {/* Hàng 1: giới tính */}
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
                  {genderData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>

            {/* Hàng 2: độ tuổi */}
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
                  {ageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
