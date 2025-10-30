import React, { createContext, useState } from "react";

export const RegulationContext = createContext();

export const RegulationProvider = ({ children }) => {
  const [regulations, setRegulations] = useState([
    {
      regulation_id: 1,
      title: "Quy định sử dụng khu vực chung",
      content: "Không hút thuốc trong khu vực chung.",
      effective_date: "2025-10-01",
      version: 1,
      status: "published",
      created_by: 1,
      created_at: "2025-10-01T00:00:00Z",
      note: "",
    },
  ]);

  const addRegulation = (newRegulation) => {
    setRegulations((prev) => [
      ...prev,
      { regulation_id: Date.now(), ...newRegulation },
    ]);
  };

  const updateRegulation = (id, updatedData) => {
    setRegulations((prev) =>
      prev.map((r) =>
        r.regulation_id === id ? { ...r, ...updatedData } : r
      )
    );
  };

  const deleteRegulation = (id) => {
    setRegulations((prev) => prev.filter((r) => r.regulation_id !== id));
  };

  const getRegulationById = (id) =>
    regulations.find((r) => r.regulation_id === id);

  return (
    <RegulationContext.Provider
      value={{
        regulations,
        addRegulation,
        updateRegulation,
        deleteRegulation,
        getRegulationById,
      }}
    >
      {children}
    </RegulationContext.Provider>
  );
};
