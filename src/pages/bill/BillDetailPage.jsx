import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { colors } from "../../constants/colors";
import { useBillContext } from "../../contexts/BillContext";
import { ROUTES } from "../../constants/routes";

export default function BillDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { bills } = useBillContext();

  const bill = useMemo(
    () => bills.find((b) => String(b.id) === String(id)),
    [bills, id]
  );

  if (!bill) {
    return (
      <div style={{ padding: 24 }}>
        Không tìm thấy hóa đơn (ID: {id}) —{" "}
        <button onClick={() => navigate(ROUTES.bills)} style={linkBtn}>
          quay lại danh sách
        </button>
      </div>
    );
  }

  const createdAt = bill.createdAt ? new Date(bill.createdAt) : null;

  const createdText = createdAt
    ? createdAt.toLocaleDateString("vi-VN") +
      " " +
      createdAt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: 24,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      {/* Card trung tâm */}
      <div style={cardWrap}>
        <div style={cardTitle}>Thông tin hóa đơn</div>

        <div style={cardBody}>
          <div style={row}>
            <div style={cellLeft}>Tên:</div>
            <div style={cellRight}>{bill.name}</div>

            <div style={cellLeft}>Ngày tạo:</div>
            <div style={cellRight}>{createdText}</div>
          </div>

          <div style={row}>
            <div style={cellLeft}>Loại:</div>
            <div style={cellRight}>{bill.category}</div>

            <div style={cellLeft}>Thời gian:</div>
            <div style={cellRight}>{bill.period}</div>
          </div>
        </div>

        <div style={{ textAlign: "right", padding: "12px 18px" }}>
          <button
            onClick={() => navigate(ROUTES.bills)}
            style={chip("#6B7280", "#fff")}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------- styles ------- */
const cardWrap = {
  width: 720,
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,.08)",
  overflow: "hidden",
};

const cardTitle = {
  textAlign: "center",
  padding: "16px 18px",
  fontWeight: 700,
  color: "#0F172A",
  borderBottom: "1px solid #EEF2F7",
};

const cardBody = { padding: 24, display: "grid", gap: 18 };
const row = {
  display: "grid",
  gridTemplateColumns: "120px 1fr 120px 1fr",
  alignItems: "center",
  gap: 10,
};

const cellLeft = { color: "#475569", textAlign: "right" };
const cellRight = { color: "#0F172A", fontWeight: 600 };

const chip = (bg, fg) => ({
  background: bg,
  color: fg,
  border: "none",
  borderRadius: 10,
  padding: "8px 16px",
  fontWeight: 700,
  cursor: "pointer",
});

const linkBtn = {
  color: "#0F3D8A",
  background: "none",
  border: "none",
  textDecoration: "underline",
  cursor: "pointer",
  fontWeight: 700,
};
