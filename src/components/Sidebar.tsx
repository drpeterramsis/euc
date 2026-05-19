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
import { getFeatureStatus } from "../utils/featureAccess";
import UserAvatar from "./UserAvatar";

/**
 * Sidebar component renders fixed navigation menu.
 * Displays current logged-in user's name and avatar read from context.
 */
export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { currentUser, users, appConfig } = useApp();
  const fullUser = users.find(u => u.id === currentUser?.id) || currentUser;

  const labels = appConfig?.navLabels || {
    dashboard: "Dashboard",
    schedule: "Trip Schedule",
    sessions: "Sessions",
    media: "Media",
    staff: "Staff Directory",
    profile: "My Profile"
  };

  const sidebarClass = `
  fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-black z-30 flex flex-col
  border-r border-gray-800 overflow-y-auto shadow-sm
  transform transition-transform duration-300
  ${isOpen ? "translate-x-0" : "-translate-x-full"}
  lg:translate-x-0
`;

  const renderNav = (label: string, to: string, icon: string, featureKey?: string) => {
    // If featureKey is provided, check access
    if (featureKey) {
      const status = getFeatureStatus(fullUser, featureKey);
      
      if (status === "disabled") return null;

      if (status === "coming_soon") {
        return (
          <NavLink
            to={`/coming-soon?feature=${featureKey}`}
            onClick={onClose}
            className={({ isActive }) =>
              `block p-3 rounded-lg transition-colors flex items-center justify-between font-medium ${isActive ? "bg-yellow-500/10 text-[#FFBF00] border-l-4 border-[#FFBF00]" : "text-white hover:bg-gray-800 hover:text-[#FFBF00]"}`
            }
          >
            <span>{icon} {label}</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full border border-gray-700 font-bold hidden sm:inline-block">Soon</span>
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
          `block p-3 rounded-lg transition-colors font-medium flex items-center gap-2 ${isActive ? "bg-yellow-500/10 text-[#FFBF00] border-l-4 border-[#FFBF00]" : "text-white hover:bg-gray-800 hover:text-[#FFBF00]"}`
        }
      >
        <span>{icon}</span> <span>{label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={sidebarClass}>
        <div className="p-4 border-b border-gray-800 flex flex-col items-center gap-2 text-white bg-black">
            <img 
              src="/images/euc_ico.png" 
              alt="EUC Logo" 
              className="h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="flex justify-between items-center w-full">
              <button
                onClick={onClose}
                className="lg:hidden text-white hover:text-yellow-400 transition-colors p-2 bg-transparent border-none outline-none shadow-none focus:outline-none"
                aria-label="Close menu"
                style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
              >
                ✕
              </button>
            </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {renderNav(labels.dashboard, "/dashboard", "📊")}
          {renderNav(labels.media, "/media", "🖼️", "photoGallery")}
          {renderNav(labels.profile, "/profile", "👤")}
          {renderNav(labels.schedule, "/schedule", "📅", "schedule")}
          {renderNav(labels.sessions, "/sessions", "🎓", "sessions")}
          {renderNav(labels.staff, "/staff", "👥")}
          {renderNav("Social Program", "/coming-soon?feature=social_program", "🎉", "social_program")}
          {renderNav("Awards Ceremony", "/coming-soon?feature=awards_ceremony", "🏆", "awards_ceremony")}
          
          {currentUser?.role === 'admin' && (
            <>
              <div className="border-t border-gray-800 my-4" />
              <NavLink
                to="/admin"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${
                    isActive
                      ? "bg-yellow-500 text-black shadow-sm"
                      : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
                  }`
                }
              >
                <span>👥 Admin Panel</span>
              </NavLink>
            </>
          )}

          <a
            href={`https://wa.me/201069996672?text=${encodeURIComponent("Hello EUC Support Team, I need technical assistance with the EUC Conference App.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 px-3 py-1.5 mt-3 opacity-70 hover:opacity-100 transition-opacity whitespace-nowrap"
          >
            💬 <span>Need Help?</span>
          </a>
        </nav>
        {/* User info and Logout button */}
        <div className="p-4 border-t border-gray-800 bg-black">
          {fullUser && (
            <div className="flex items-center space-x-3 mb-4">
              <UserAvatar user={fullUser} size="md" className="border border-gray-700" />
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white truncate">{fullUser.name || fullUser.username}</span>
                <span className="text-xs text-yellow-500 font-semibold">{fullUser.role.toUpperCase()}</span>
              </div>
            </div>
          )}
          <button 
              className="w-full text-center p-3 rounded-lg font-bold transition-colors bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800 shadow-sm"
              onClick={logout}
          >
              Logout
          </button>
        </div>
      </aside>
    </>
  );
}
