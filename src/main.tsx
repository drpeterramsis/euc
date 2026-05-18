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

// Initialize React root, wrap in AppProvider, and render App component
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
