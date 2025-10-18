import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import RootProvider from "./contexts/RootProvider";
import App from "./App";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RootProvider>
        <App />
      </RootProvider>
    </BrowserRouter>
  </React.StrictMode>
);
