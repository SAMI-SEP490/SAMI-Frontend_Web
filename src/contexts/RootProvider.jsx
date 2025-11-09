import React from "react";
import { UserProvider } from "./UserContext";
import { ContractProvider } from "./ContractContext";
import { BillProvider } from "./BillContext";
import { GuestRegistrationProvider } from "./GuestRegistrationContext";
import { NotificationProvider } from "./NotificationContext";
import { MaintenanceProvider } from "./MaintainanceContext";
import { RegulationProvider } from "./RegulationContext";
export default function RootProvider({ children }) {
  return (
    <MaintenanceProvider>
      <NotificationProvider>
        <GuestRegistrationProvider>
          <UserProvider>
            <ContractProvider>
              <RegulationProvider>
                <BillProvider>{children}</BillProvider>
              </RegulationProvider>
            </ContractProvider>
          </UserProvider>
        </GuestRegistrationProvider>
      </NotificationProvider>
    </MaintenanceProvider>
  );
}
