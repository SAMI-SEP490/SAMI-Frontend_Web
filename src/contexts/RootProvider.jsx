import { ContractProvider } from "./ContractProvider";
import { UserProvider } from "./UserContext";
import { BillProvider } from "./BillContext";
export const RootProvider = ({ children }) => (
  <UserProvider>
    <ContractProvider>
      {children}
      <BillProvider>{children}</BillProvider>
    </ContractProvider>
  </UserProvider>
);
