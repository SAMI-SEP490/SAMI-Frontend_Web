import { ContractProvider } from "./ContractContext";
import { UserProvider } from "./UserContext";
export const RootProvider = ({ children }) => (
  <UserProvider>
    <ContractProvider>{children}</ContractProvider>
  </UserProvider>
);
