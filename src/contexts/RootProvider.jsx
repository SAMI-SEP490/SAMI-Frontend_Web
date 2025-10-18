import React from "react";
import { UserProvider } from "./UserContext";
import { ContractProvider } from "./ContractProvider";
import { BillProvider } from "./BillContext";

export default function RootProvider({ children }) {
  return (
    <UserProvider>
      <ContractProvider>
        <BillProvider>{children}</BillProvider>
      </ContractProvider>
    </UserProvider>
  );
}
