// ─────────────────────────────────────────────
// FILE: src/App.tsx
// PURPOSE: Main application component, sets up
// routing, protected route logic, and global loading state.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Schedule from './pages/Schedule';
import Sessions from './pages/Sessions';
import Admin from './pages/Admin';
import { 
  AdminUsers, AdminPosts, AdminCategories, AdminSessions, 
  AdminTripSchedule, AdminFlightHotel, AdminCountdown, 
  AdminMedia, AdminDirectory, AdminNotifications, 
  AdminSettings, AdminAppearance 
} from './pages/admin/AdminFeaturePages';
import ComingSoon from './pages/ComingSoon';
import AccessDenied from './pages/AccessDenied';
import Media from './pages/Media';
import Messages from './pages/Messages';
import Staff from './pages/Staff';
import Directory from './pages/Directory'; 
import { useApp } from './context/AppContext';
import { getFeatureStatus } from './utils/featureAccess';
import { useSwipeBack } from './hooks/useSwipeBack';

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

const FeatureRoute = ({ children, featureKey }: { children: React.ReactNode, featureKey: string }) => {
  const { currentUser, users } = useApp();
  const fullUser = users.find(u => u.id === currentUser?.id) || currentUser;
  
  if (!fullUser) return <Navigate to="/" replace />;
  
  const status = getFeatureStatus(fullUser, featureKey);
  
  if (status === "disabled") return <Navigate to="/dashboard" replace />;
  if (status === "coming_soon") return <Navigate to={`/coming-soon?feature=${featureKey}`} replace />;
  
  return <>{children}</>;
};

function AppRoutes() {
  useSwipeBack(); // global swipe-back
  
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><FeatureRoute featureKey="schedule"><Schedule /></FeatureRoute></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/sessions" element={<ProtectedRoute><FeatureRoute featureKey="sessions"><Sessions /></FeatureRoute></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/posts" element={<AdminRoute><AdminPosts /></AdminRoute>} />
      <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
      <Route path="/admin/sessions" element={<AdminRoute><AdminSessions /></AdminRoute>} />
      <Route path="/admin/trip-schedule" element={<AdminRoute><AdminTripSchedule /></AdminRoute>} />
      <Route path="/admin/flight-hotel" element={<AdminRoute><AdminFlightHotel /></AdminRoute>} />
      <Route path="/admin/countdown" element={<AdminRoute><AdminCountdown /></AdminRoute>} />
      <Route path="/admin/media" element={<AdminRoute><AdminMedia /></AdminRoute>} />
      <Route path="/admin/directory" element={<AdminRoute><AdminDirectory /></AdminRoute>} />
      <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/admin/appearance" element={<AdminRoute><AdminAppearance /></AdminRoute>} />
      <Route path="/media" element={<ProtectedRoute><FeatureRoute featureKey="photoGallery"><Media /></FeatureRoute></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
      <Route path="/directory" element={<ProtectedRoute><Directory /></ProtectedRoute>} /> {/* ← NEW */}
      <Route path="/coming-soon" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
      <Route path="/access-denied" element={<ProtectedRoute><AccessDenied /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * App component manages the application routing and global loading state.
 */
export default function App() {
  const { loading, isFirstLoad, isBackgroundRefreshing } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

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
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}
