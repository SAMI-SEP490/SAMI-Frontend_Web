import React, { useState, createContext } from "react";

export const ContractContext = createContext();

export const ContractProvider = ({ children }) => {
  const [contractData, setContractData] = useState([
    {
      id: "HD-001",
      tenantId: 4,
      _room: "101",
      get room() {
        return this._room;
      },
      set room(value) {
        this._room = value;
      },
      startDate: "2025-01-10",
      endDate: "2026-01-10",
      status: "Đang hoạt động",
      appendicesId: ["PL-001", "PL-002"], // ✅ liên kết phụ lục
    },
    {
      id: "HD-002",
      tenantId: 5,
      room: "202",
      startDate: "2024-11-01",
      endDate: "2025-11-01",
      status: "Đang xử lý",
      appendicesId: ["PL-003"], // ✅
    },
    {
      id: "HD-003",
      tenantId: 6,
      room: "303",
      startDate: "2023-12-15",
      endDate: "2024-12-15",
      status: "Hết hạn",
      appendicesId: [], // Không có phụ lục
    },
    {
      id: "HD-004",
      tenantId: 7,
      room: "402",
      startDate: "2025-02-01",
      endDate: "2026-02-01",
      status: "Đang hoạt động",
      appendicesId: ["PL-004", "PL-005"],
    },
    {
      id: "HD-005",
      tenantId: 1,
      room: "105",
      startDate: "2025-04-10",
      endDate: "2025-10-10",
      status: "Đã hủy",
      appendicesId: ["PL-006"],
    },
  ]);

  const [contractIdDetail, setContractIdDetail] = useState(null);

  const [appendices, setappendices] = useState([
    {
      id: "PL-001",
      contractId: "HD-001",
      type: "Đổi giá thuê",
      content: "Tăng giá thuê thêm 500.000 VND/tháng",
      effectiveDate: "2025-07-01",
      status: "Đang hiệu lực",
    },
    {
      id: "PL-002",
      contractId: "HD-001",
      type: "Gia hạn",
      content: "Gia hạn hợp đồng thêm 6 tháng",
      effectiveDate: "2025-12-01",
      status: "Chưa hiệu lực",
    },
    {
      id: "PL-003",
      contractId: "HD-002",
      type: "Thay đổi người thuê",
      content: "Thay đổi người thuê chính trong hợp đồng",
      effectiveDate: "2025-01-15",
      status: "Đang xử lý",
    },
    {
      id: "PL-004",
      contractId: "HD-004",
      type: "Điều chỉnh tiền cọc",
      content: "Giảm tiền cọc xuống còn 8.000.000 VND",
      effectiveDate: "2025-03-01",
      status: "Đang hiệu lực",
    },
    {
      id: "PL-005",
      contractId: "HD-004",
      type: "Gia hạn bảo trì",
      content: "Thêm điều khoản bảo trì định kỳ hàng quý",
      effectiveDate: "2025-06-15",
      status: "Chưa hiệu lực",
    },
    {
      id: "PL-006",
      contractId: "HD-005",
      type: "Chấm dứt hợp đồng",
      content: "Hai bên đồng thuận chấm dứt hợp đồng sớm",
      effectiveDate: "2025-09-30",
      status: "Đã hết hiệu lực",
    },
  ]);

  const addContract = (contract) => {
    setContractData((prev) => [...prev, contract]);
  };
  return (
    <ContractContext.Provider
      value={{
        contractData,
        setContractData,
        contractIdDetail,
        setContractIdDetail,
        appendices,
        setappendices,
        addContract,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};
