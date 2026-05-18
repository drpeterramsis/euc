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
  const { loading, isFirstLoad, isBackgroundRefreshing } = useApp();

  if (loading && isFirstLoad) return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center">
      <div className="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">EUC<span className="text-yellow-500">.</span></div>
      <div className="text-gray-500 text-xs mb-8 font-medium">EVA URO CLUB</div>
      <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent
                      rounded-full animate-spin"></div>
      <div className="text-gray-500 text-sm mt-6 font-medium">Loading conference data...</div>
    </div>
  );

  return (
    <>
      {isBackgroundRefreshing && (
        <div className="fixed bottom-4 right-4 z-50
                        flex items-center gap-2
                        bg-white text-gray-600
                        text-xs px-3 py-2 rounded-full
                        border border-gray-200 shadow-sm font-medium">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          Syncing...
        </div>
      )}
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
    </>
  );
}
