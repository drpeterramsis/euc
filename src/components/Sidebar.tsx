// ─────────────────────────────────────────────
// FILE: src/components/Sidebar.tsx
// PURPOSE: Renders the navigation sidebar,
// now mobile responsive with hamburger mechanism.
// Displays the user identity & logout button at the TOP (Zone 2)
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { logout } from "../utils/auth";
import { useApp } from "../context/AppContext";
import { getFeatureStatus } from "../utils/featureAccess";
import UserAvatar from "./UserAvatar";
import { getPageAccess, isNavVisible } from "../utils/pageAccess";

/**
 * Sidebar component renders fixed navigation menu.
 * Displays current logged-in user's name and avatar read from context.
 */
export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { currentUser, users, appConfig, isAppInstalled, installPrompt, triggerInstall } = useApp();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const fullUser = users.find(u => u.id === currentUser?.id) || currentUser;

  const labels = appConfig?.navLabels || {
    dashboard: "Home Page",
    schedule: "Schedule",
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

  const normalizedRole = currentUser?.role?.trim().toLowerCase();

  const visibleNavItems = navItems.filter(item => isNavVisible(item.key, normalizedRole, appConfig));

  const handleInstallClick = async () => {
    if (installPrompt) {
      await triggerInstall();
    } else {
      setShowInstallModal(true);
    }
  };

  const getSystemInstructions = () => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    if (isIOS) {
      return (
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
          <li>Open this app in <strong>Safari</strong>.</li>
          <li>Tap the <strong>Share</strong> icon at the bottom of the screen.</li>
          <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
        </ol>
      );
    }
    return (
      <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
        <li>Open this app in <strong>Chrome</strong> or a compatible browser.</li>
        <li>Tap the browser menu (⋮) in the top right.</li>
        <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
      </ol>
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
        
        {/* Zone 1 — Logo (fixed, never scrolls) */}
        <div className="flex-shrink-0 p-4 border-b border-gray-800 flex flex-col items-center gap-2 text-white bg-black">
          <img 
            src="/images/euc_ico.png" 
            alt="EUC Logo" 
            className="h-16 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="flex justify-between items-center w-full lg:hidden">
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-400 transition-colors p-2 bg-transparent border-none outline-none shadow-none focus:outline-none"
              aria-label="Close menu"
              style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Zone 2 — User Card + Logout Button (TOP, under logo, always visible) */}
        {fullUser && (
          <div className="flex-shrink-0 px-3 py-3 border-b border-gray-800 bg-black">
            <div className="flex items-center gap-2 mb-2">
              <UserAvatar user={fullUser} size="sm" className="border border-gray-700" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {fullUser.name || fullUser.username}
                </p>
                <p className="text-xs text-yellow-500 uppercase font-medium tracking-wide">
                  {fullUser.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full bg-gray-800 hover:bg-red-600 text-white
                         font-semibold py-1.5 rounded-lg transition-colors
                         text-xs text-center border-none cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}

        {/* Zone 3 — Nav Items (scrollable middle zone) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3
                        scrollbar-thin scrollbar-thumb-gray-700
                        scrollbar-track-transparent space-y-1">
          {visibleNavItems.map(item => {
            const access = getPageAccess(item.key, normalizedRole, appConfig);
            const isComingSoon = access === "coming-soon";

            return (
              <NavLink
                key={item.key}
                to={item.path}
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
                {isComingSoon && (
                  <span className="ml-auto text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </NavLink>
            );
          })}
          
          {normalizedRole === 'admin' && (
            <>
              <div className="border-t border-gray-800 my-4" />
              <NavLink
                to="/admin"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${
                    isActive
                      ? "bg-yellow-50 text-black shadow-sm font-bold"
                      : "bg-yellow-50 text-yellow-700 hover:bg-yellow-10 border border-yellow-250 font-bold"
                  }`
                }
              >
                <span>👥 Admin Panel</span>
              </NavLink>
            </>
          )}

          {!isAppInstalled && (
            <div className="my-4 px-2">
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-bold text-sm transition-colors cursor-pointer border border-yellow-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Install App
              </button>
            </div>
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
      </aside>

      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">How to Install</h3>
              <button 
                onClick={() => setShowInstallModal(false)}
                className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors border-none"
              >
                ✕
              </button>
            </div>
            {getSystemInstructions()}
            <button 
              onClick={() => setShowInstallModal(false)}
              className="mt-6 w-full py-2 bg-black hover:bg-gray-900 text-white font-bold rounded-lg transition-colors cursor-pointer border-none"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
