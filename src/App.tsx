// ─────────────────────────────────────────────
// FILE: src/App.tsx
// PURPOSE: Main application component, sets up
// routing, protected route logic, and global loading state.
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
import ComingSoon from './pages/ComingSoon';
import { useApp } from './context/AppContext';

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

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const sessionRaw = localStorage.getItem("euc_user");
  if (!sessionRaw) return <Navigate to="/" replace />;
  try {
    const user = JSON.parse(sessionRaw);
    if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  } catch {
    localStorage.removeItem("euc_user");
    return <Navigate to="/" replace />;
  }
};

/**
 * App component manages the application routing and global loading state.
 */
export default function App() {
  const { loading, isFirstLoad } = useApp();

  if (loading && isFirstLoad) return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <div className="text-4xl font-bold text-yellow-400 mb-4">EUC</div>
      <div className="text-white text-sm mb-6">EVA URO CLUB</div>
      <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent
                      rounded-full animate-spin"></div>
      <div className="text-gray-400 text-sm mt-4">Loading conference data...</div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/coming-soon" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
