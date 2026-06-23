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
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Only register service worker in production environments (not inside the development sandboxed iframe)
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  try {
    registerSW({ 
      immediate: true,
      onRegisterError(error: any) {
        console.warn('Service worker registration failed:', error);
      }
    });
  } catch (err) {
    console.warn('Failed to call registerSW:', err);
  }
}

const forceLight = () => {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
  document.documentElement.style.colorScheme = "light";
  document.documentElement.setAttribute("data-theme", "light");
  document.documentElement.setAttribute("data-color-scheme", "light");
};

forceLight();

const obs = new MutationObserver(forceLight);
obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

// Initialize React root, wrap in AppProvider, and render App component
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
