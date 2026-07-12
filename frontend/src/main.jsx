import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// Find the root element from index.html.
const rootElement = document.getElementById("root");

// Start the React application.
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);