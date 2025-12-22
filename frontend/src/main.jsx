import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./Context/ThemeContext";
import { AuthProvider } from "./Context/AuthContext";
import { SidebarProvider } from "./Context/SidebarContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <SidebarProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
      </SidebarProvider>
    </ThemeProvider>
  </StrictMode>
);
