import React, { useState } from "react";
import { ContractContext } from "./ContractContext";

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
    },
    {
      id: "HD-002",
      tenantId: 5,
      room: "202",
      startDate: "2024-11-01",
      endDate: "2025-11-01",
      status: "Đang xử lý",
    },
    {
      id: "HD-003",
      tenantId: 6,
      room: "303",
      startDate: "2023-12-15",
      endDate: "2024-12-15",
      status: "Hết hạn",
    },
    {
      id: "HD-004",
      tenantId: 7,
      room: "402",
      startDate: "2025-02-01",
      endDate: "2026-02-01",
      status: "Đang hoạt động",
    },
    {
      id: "HD-005",
      tenantId: 1,
      room: "105",
      startDate: "2025-04-10",
      endDate: "2025-10-10",
      status: "Đã hủy",
    },
  ]);

  return (
    <ContractContext.Provider
      value={{
        contractData,
        setContractData,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};
