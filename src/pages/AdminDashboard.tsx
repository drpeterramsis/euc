import React from "react";
import DualClock from "../components/DualClock";

// ─────────────────────────────────────────────
// FILE: src/pages/AdminDashboard.tsx
// PURPOSE: Admin home view carrying stats & quick action panel.
// ─────────────────────────────────────────────

interface AdminDashboardProps {
  onSelectTab: (tab: string) => void;
}

const adminTools = [
  { key: 'users', label: 'Users & Roles', icon: '👥' },
  { key: 'messages', label: 'Messages', icon: '✉️' },
  { key: 'appConfig', label: 'App Settings', icon: '⚙️' },
  { key: 'tripInfo', label: 'Trip Info', icon: '🏨' },
  { key: 'schedule', label: 'Schedule', icon: '📅' },
  { key: 'features', label: 'Feature Access', icon: '🚀' },
  { key: 'media', label: 'Media / Posts', icon: '🖼️' },
  { key: 'categories', label: 'Categories', icon: '📂' },
  { key: 'pageSettings', label: 'Page Access', icon: '🔒' },
];

export default function AdminDashboard({ onSelectTab }: AdminDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="px-4 pt-4 pb-2">
        <DualClock />
      </div>

      {/* Overview Intro */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Welcome to your Admin Hub</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-2xl font-medium">
          Control application properties, manage passenger documents, configure live schedules, broadcast announcements, and monitor active user sessions from a single unified panel.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
         <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-wider text-sm">Tools & Settings</h3>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
           {adminTools.map(tool => (
             <button
                key={tool.key}
                onClick={() => onSelectTab(tool.key)}
                className="w-full py-4 rounded-xl text-sm font-medium text-center bg-gray-50 border border-gray-200 text-gray-700 hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-700 focus:outline-none transition-all flex flex-col items-center justify-center gap-2"
             >
                <span className="text-2xl">{tool.icon}</span>
                <span>{tool.label}</span>
             </button>
           ))}
         </div>
      </div>
    </div>
  );
}
