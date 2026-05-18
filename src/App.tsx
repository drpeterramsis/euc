// ─────────────────────────────────────────────
// FILE: src/App.tsx
// PURPOSE: Main application component, sets up
// routing and protected route logic.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Schedule from './pages/Schedule';
import Sessions from './pages/Sessions';
import Admin from './pages/Admin';

/**
 * ProtectedRoute component verifies authentication synchronously.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const sessionRaw = localStorage.getItem("euc_user");
  if (!sessionRaw) {
    return <Navigate to="/" replace />;
  }
  try {
    JSON.parse(sessionRaw); // validate it's real JSON
    return <>{children}</>;
  } catch {
    localStorage.removeItem("euc_user");
    return <Navigate to="/" replace />;
  }
};

/**
 * App component manages the application routing.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
