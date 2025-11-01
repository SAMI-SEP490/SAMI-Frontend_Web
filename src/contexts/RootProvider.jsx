import React from "react";
import { UserProvider } from "./UserContext";
import { ContractProvider } from "./ContractContext";
import { BillProvider } from "./BillContext";
import { GuestRegistrationProvider } from "./GuestRegistrationContext";
import { NotificationProvider } from "./NotificationContext";
import { MaintenanceProvider } from "./MaintainanceContext";
export default function RootProvider({ children }) {
  return (
    <MaintenanceProvider>
      <NotificationProvider>
        <GuestRegistrationProvider>
          <UserProvider>
            <ContractProvider>
              <BillProvider>{children}</BillProvider>
            </ContractProvider>
          </UserProvider>
        </GuestRegistrationProvider>
      </NotificationProvider>
    </MaintenanceProvider>
  );
}
