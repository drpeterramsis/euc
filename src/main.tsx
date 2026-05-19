// ─────────────────────────────────────────────
// FILE: src/main.tsx
// PURPOSE: Application entry point.
// Renders the React root in the DOM with AppProvider.
// ─────────────────────────────────────────────

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from "./context/AppContext";
import './index.css';

// Force light mode at React boot — overrides any system/browser dark preference
document.documentElement.classList.remove("dark");
document.documentElement.classList.add("light");
document.documentElement.style.colorScheme = "light only";
document.documentElement.setAttribute("data-color-scheme", "light");
document.documentElement.setAttribute("data-theme", "light");

// Continuously enforce light mode (catches late Chrome dark-mode injection)
const enforceLightMode = () => {
  if (document.documentElement.classList.contains("dark")) {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
  if (document.documentElement.style.colorScheme !== "light only" && document.documentElement.style.colorScheme !== "light") {
    document.documentElement.style.colorScheme = "light only";
  }
};
const lightModeObserver = new MutationObserver(enforceLightMode);
lightModeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class", "style"],
});

// Initialize React root, wrap in AppProvider, and render App component
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
