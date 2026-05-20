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
    dashboard: "Home Page",
    schedule: "Trip Schedule",
    sessions: "Sessions",
    media: "News Feed",
    directory: "Staff Directory",
    profile: "My Profile"
  };

  const sidebarClass = `
    fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-black z-30 flex flex-col
    border-r border-gray-800 shadow-sm
    transform transition-transform duration-300
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
  `;

  // All possible nav items (master list — never changes)
  const ALL_NAV_ITEMS = [
    { key: "dashboard",  path: "/dashboard",   icon: "🏠" },
    { key: "schedule",   path: "/schedule",    icon: "📅", featureKey: "schedule" },
    { key: "sessions",   path: "/sessions",    icon: "🎓", featureKey: "sessions" },
    { key: "media",      path: "/media",       icon: "🖼️", featureKey: "photoGallery" },
    { key: "directory",  path: "/directory",   icon: "👥" },
    { key: "profile",    path: "/profile",     icon: "👤" },
  ];

  // Get order from config, fallback to default
  const navOrder = appConfig?.navOrder ?? ALL_NAV_ITEMS.map(i => i.key);

  // Sort nav items by navOrder
  const orderedNavItems = [
    ...navOrder
      .map(key => ALL_NAV_ITEMS.find(i => i.key === key))
      .filter(Boolean),
    // Append any items not in navOrder
    ...ALL_NAV_ITEMS.filter(i => !navOrder.includes(i.key)),
  ] as typeof ALL_NAV_ITEMS;

  // Apply labels from config
  const navItems = orderedNavItems.map(item => ({
    ...item,
    label: (appConfig?.navLabels as any)?.[item.key] ?? labels[item.key as keyof typeof labels] ?? item.key,
  }));

  // Visibility Filter logic for pages
  const visibleNavItems = navItems.filter(item => {
    if (item.key === "directory") {
      const dirConfig = appConfig?.pages?.directory;
      return currentUser?.role === "admin" || (dirConfig?.visible !== false);
    }
    if (item.key === "media") {
      const mediaConfig = appConfig?.pages?.media;
      return currentUser?.role === "admin" || (mediaConfig?.visible !== false);
    }
    return true;
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={sidebarClass}>
        {/* Zone 1 — Logo: fixed, never scrolls */}
        <div className="flex-shrink-0 p-4 border-b border-gray-800 flex flex-col items-center gap-2 text-white bg-black">
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

        {/* Zone 2 — Nav items: scrollable if overflow */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {visibleNavItems.map(item => {
            // Determine path and checking status
            const isDir = item.key === "directory";
            const isMedia = item.key === "media";
            
            const config = isDir 
              ? appConfig?.pages?.directory 
              : isMedia 
                ? appConfig?.pages?.media 
                : null;

            const isComingSoon = config?.comingSoon === true;
            const isHidden = config?.visible === false;

            // Route dynamic behavior
            let finalPath = item.path;
            if (isComingSoon && currentUser?.role !== "admin") {
              finalPath = `/coming-soon?feature=${item.key}`;
            }

            // Normal feature-specific status constraints
            if (item.featureKey) {
              const status = getFeatureStatus(fullUser, item.featureKey);
              if (status === "disabled" && currentUser?.role !== "admin") return null;
              if (status === "coming_soon" && currentUser?.role !== "admin") {
                finalPath = `/coming-soon?feature=${item.featureKey}`;
              }
            }

            return (
              <NavLink
                key={item.key}
                to={finalPath}
                onClick={onClose}
                className={({ isActive }) =>
                  `block p-3 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                    isActive 
                      ? "bg-yellow-500/10 text-[#FFBF00] border-l-4 border-[#FFBF00]" 
                      : "text-white hover:bg-gray-800 hover:text-[#FFBF00]"
                  }`
                }
              >
                <span>{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                
                {/* Coming Soon badge on sidebar item */}
                {config?.comingSoon && (
                  <span className="ml-auto text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </NavLink>
            );
          })}
          
          {currentUser?.role === 'admin' && (
            <>
              <div className="border-t border-gray-800 my-4" />
              <NavLink
                to="/admin"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${
                    isActive
                      ? "bg-yellow-50 text-black shadow-sm"
                      : "bg-yellow-50 text-yellow-700 hover:bg-yellow-10 border border-yellow-200"
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

        {/* Zone 3 — User card + Logout: fixed at bottom, NEVER scrolls */}
        <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-black">
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
