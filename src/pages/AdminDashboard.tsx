import React, { useState, useEffect } from "react";
import AdminQuickActions from "../components/AdminQuickActions";

// ─────────────────────────────────────────────
// FILE: src/pages/AdminDashboard.tsx
// PURPOSE: Admin home view carrying stats & new consolidated quick action panel.
// ─────────────────────────────────────────────

interface AdminDashboardProps {
  onSelectTab: (tab: string) => void;
}

export default function AdminDashboard({ onSelectTab }: AdminDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Overview Intro */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Welcome to your Admin Hub</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-2xl font-medium">
          Control application properties, manage passenger documents, configure live schedules, broadcast announcements, and monitor active user sessions from a single unified panel.
        </p>
      </div>

      {/* Full Admin Quick Actions Grid */}
      <AdminQuickActions />
    </div>
  );
}
