// ─────────────────────────────────────────────
// FILE: src/App.tsx
// PURPOSE: Main application component, sets up
// routing for all pages.
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
import { isAuthenticated } from './utils/auth';

/**
 * ProtectedRoute component verifies authentication before rendering children.
 */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
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
