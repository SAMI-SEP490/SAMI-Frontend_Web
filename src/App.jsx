// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routing/AppRoutes";
import { RootProvider } from "./contexts/RootProvider";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  return (
    <BrowserRouter>
      <RootProvider>
        <AppRoutes />
      </RootProvider>
    </BrowserRouter>
  );
}
