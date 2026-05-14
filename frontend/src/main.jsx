import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { initAnalytics } from "./utils/analytics.js";

// No-op when VITE_PLAUSIBLE_DOMAIN is unset.
initAnalytics();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
