import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ThemeProvider from "@/components/theme-provider";
import "./styles.css";
import "./styles/accessibility.css";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
