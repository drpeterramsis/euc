// ─────────────────────────────────────────────
// FILE: src/components/Sidebar.tsx
// PURPOSE: Renders the navigation sidebar component.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { logout } from "../utils/auth";

/**
 * Sidebar component renders fixed navigation menu.
 * Displays current logged-in user's name and avatar read from localStorage.
 */
export default function Sidebar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const sessionRaw = localStorage.getItem("euc_user");
    if(sessionRaw) setUser(JSON.parse(sessionRaw));
  }, []);

  return (
    <aside className="w-64 bg-black text-white h-screen fixed top-0 left-0 hidden md:flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-gray-800">
        EUC <span className="text-yellow-500">EVA URO</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <a href="/dashboard" className="block p-3 hover:bg-gray-900 rounded">Dashboard</a>
        <a href="/profile" className="block p-3 hover:bg-gray-900 rounded">My Profile</a>
        <a href="/schedule" className="block p-3 hover:bg-gray-900 rounded">Trip Schedule</a>
        <a href="/sessions" className="block p-3 hover:bg-gray-900 rounded">Sessions</a>
        {user?.role === 'admin' && (
            <a href="/admin" className="block p-3 hover:bg-gray-900 rounded">Admin Panel</a>
        )}
      </nav>
      {/* User info and Logout button */}
      <div className="p-4 border-t border-gray-800">
        {user && (
          <div className="flex items-center space-x-3 mb-4">
            <img src={user.photo} className="w-8 h-8 rounded-full" alt="Avatar" />
            <span className="text-sm">{user.name}</span>
          </div>
        )}
        <button 
            className="w-full text-left p-3 hover:bg-red-900 rounded text-red-400"
            onClick={logout}
        >
            Logout
        </button>
      </div>
    </aside>
  );
}
