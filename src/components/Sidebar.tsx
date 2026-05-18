// ─────────────────────────────────────────────
// FILE: src/components/Sidebar.tsx
// PURPOSE: Renders the navigation sidebar,
// now mobile responsive with hamburger mechanism.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { NavLink } from "react-router-dom";
import { logout } from "../utils/auth";
import { useApp } from "../context/AppContext";

/**
 * Sidebar component renders fixed navigation menu.
 * Displays current logged-in user's name and avatar read from context.
 */
export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { currentUser, users } = useApp();
  const fullUser = users.find(u => u.id === currentUser?.id) || currentUser;

  const sidebarClass = `
  fixed top-0 left-0 h-full w-64 bg-black z-50 flex flex-col
  transform transition-transform duration-300
  ${isOpen ? "translate-x-0" : "-translate-x-full"}
  lg:translate-x-0
`;

  const renderNav = (label: string, to: string, icon: string, featureKey?: string) => {
    // If featureKey is provided, check access
    if (featureKey && fullUser?.featureAccess) {
      if (!fullUser.featureAccess[featureKey]) return null; // OFF

      if (fullUser.featureAccess[featureKey] === 'coming_soon') {
        return (
          <NavLink
            to={`/coming-soon?feature=${featureKey}`}
            onClick={onClose}
            className={({ isActive }) =>
              `block p-3 rounded transition-colors flex items-center justify-between ${isActive ? "bg-yellow-500 text-black font-bold" : "text-white hover:bg-gray-900"}`
            }
          >
            <span>{icon} {label}</span>
            <span className="text-xs bg-gray-700 text-yellow-400 px-2 py-1 rounded">Soon</span>
          </NavLink>
        );
      }
    }

    // Default Full Access
    return (
      <NavLink
        to={to}
        onClick={onClose}
        className={({ isActive }) =>
          `block p-3 rounded transition-colors ${isActive ? "bg-yellow-500 text-black font-bold" : "text-white hover:bg-gray-900"}`
        }
      >
        {icon} {label}
      </NavLink>
    );
  };

  return (
    <>
      <aside className={sidebarClass}>
        <div className="p-6 text-2xl font-bold border-b border-gray-800 flex justify-between items-center text-white">
            <div>EUC <span className="text-yellow-500">EVA URO</span></div>
            <button className="lg:hidden text-white" onClick={onClose}>✕</button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {renderNav("Dashboard", "/dashboard", "📊")}
          {renderNav("My Profile", "/profile", "👤")}
          {renderNav("Trip Schedule", "/schedule", "📅", "schedule")}
          {renderNav("Sessions", "/sessions", "🎓", "sessions")}
          {renderNav("Social Program", "/coming-soon?feature=social_program", "🎉", "social_program")}
          {renderNav("Awards Ceremony", "/coming-soon?feature=awards_ceremony", "🏆", "awards_ceremony")}
          {renderNav("Photo Gallery", "/coming-soon?feature=photo_gallery", "📷", "photo_gallery")}
          {renderNav("Documents", "/coming-soon?feature=documents", "📄", "documents")}
          
          {currentUser?.role === 'admin' && (
            <>
              <div className="border-t border-gray-700 my-2" />
              <NavLink
                to="/admin"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${
                    isActive
                      ? "bg-yellow-500 text-black"
                      : "bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20"
                  }`
                }
              >
                <span>👥 Admin Panel</span>
              </NavLink>
            </>
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
