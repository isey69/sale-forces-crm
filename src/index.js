import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Remove loading screen when React app is ready
const removeLoadingScreen = () => {
  const event = new Event("app-ready");
  window.dispatchEvent(event);
};

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Signal that the app is ready
setTimeout(removeLoadingScreen, 100);
