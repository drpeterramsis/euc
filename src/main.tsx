// ─────────────────────────────────────────────
// FILE: src/main.tsx
// PURPOSE: Application entry point.
// Renders the React root in the DOM.
// ─────────────────────────────────────────────

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize React root and render App component
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
