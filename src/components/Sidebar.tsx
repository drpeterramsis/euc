// ─────────────────────────────────────────────
// FILE: src/components/Sidebar.tsx
// PURPOSE: Renders the navigation sidebar,
// now mobile responsive with hamburger mechanism.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { logout } from "../utils/auth";
import { useApp } from "../context/AppContext";

/**
 * Sidebar component renders fixed navigation menu.
 * Displays current logged-in user's name and avatar read from context.
 */
export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { currentUser } = useApp();

  const sidebarClass = `
  fixed top-0 left-0 h-full w-64 bg-black z-50
  transform transition-transform duration-300
  ${isOpen ? "translate-x-0" : "-translate-x-full"}
  lg:translate-x-0
`;

  return (
    <>
      <aside className={sidebarClass}>
        <div className="p-6 text-2xl font-bold border-b border-gray-800 flex justify-between items-center">
            <div>EUC <span className="text-yellow-500">EVA URO</span></div>
            <button className="lg:hidden text-white" onClick={onClose}>✕</button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/dashboard" className="block p-3 hover:bg-gray-900 rounded text-white">Dashboard</a>
          <a href="/profile" className="block p-3 hover:bg-gray-900 rounded text-white">My Profile</a>
          <a href="/schedule" className="block p-3 hover:bg-gray-900 rounded text-white">Trip Schedule</a>
          <a href="/sessions" className="block p-3 hover:bg-gray-900 rounded text-white">Sessions</a>
          {currentUser?.role === 'admin' && (
              <a href="/admin" className="block p-3 hover:bg-gray-900 rounded text-white">Admin Panel</a>
          )}
        </nav>
        {/* User info and Logout button */}
        <div className="p-4 border-t border-gray-800">
          {currentUser && (
            <div className="flex items-center space-x-3 mb-4">
              <img src={currentUser.photo} className="w-8 h-8 rounded-full" alt="Avatar" />
              <span className="text-sm text-white truncate">{currentUser.name}</span>
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
    </>
  );
}
