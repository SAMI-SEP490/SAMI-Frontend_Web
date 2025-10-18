import React, { createContext, useContext, useState } from "react";

const BillContext = createContext(null);

// Mock data
const DEFAULT_BILLS = [
  {
    id: "BL-001",
    name: "Tiền nước",
    category: "Chi phí sinh hoạt",
    period: "Một tháng",
    createdAt: "2025-08-28T16:30:00+07:00",
  },
  {
    id: "BL-002",
    name: "Tiền điện",
    category: "Chi phí sinh hoạt",
    period: "Một tháng",
    createdAt: "2025-07-12T09:00:00+07:00",
  },
  {
    id: "BL-003",
    name: "Tiền Giặt Là",
    category: "Dịch vụ",
    period: "Một tuần",
    createdAt: "2025-06-05T14:15:00+07:00",
  },
];

export function BillProvider({ children }) {
  const [bills, setBills] = useState(DEFAULT_BILLS);
  const value = { bills, setBills };
  return <BillContext.Provider value={value}>{children}</BillContext.Provider>;
}

// ✅ Hook tên rõ ràng – import dùng: `const { bills } = useBillContext();`
// eslint-disable-next-line react-refresh/only-export-components
export function useBillContext() {
  const ctx = useContext(BillContext);
  if (!ctx)
    throw new Error("useBillContext must be used inside <BillProvider>");
  return ctx;
}
