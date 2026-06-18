// ─────────────────────────────────────────────
// FILE: src/components/Header.tsx
// PURPOSE: Renders top header with hamburger menu.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useApp, matchesRole } from "../context/AppContext";
import { Link, useLocation } from "react-router-dom";
import { getLabel } from "../utils/labels";
import UserAvatar from "./UserAvatar";

/**
 * Header component displays page context and user avatar.
 */
export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { currentUser, appConfig, messages } = useApp();
  const location = useLocation();

  const isMessageVisible = (m: any) => {
    if (!currentUser) return false;
    const audienceObj = m.audience || m.recipients || m.targetRole || "all";
    return matchesRole(audienceObj, currentUser.role);
  };

  let unreadCount = 0;
  if (messages && currentUser && location.pathname !== "/activity") {
    unreadCount = messages.filter(
      (m: any) =>
        m.status === "published" &&
        (!m.expiresAt || new Date(m.expiresAt).getTime() > Date.now()) &&
        isMessageVisible(m) &&
        m.readBy &&
        !m.readBy.includes(currentUser.id)
    ).length;
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-gray-800 flex items-center justify-between px-4 z-40 shadow-sm">
      <div className="flex items-center overflow-hidden">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-white hover:text-yellow-400 transition-colors p-2 mr-2 bg-transparent border-none outline-none shadow-none focus:outline-none"
          aria-label="Toggle menu"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
        >
          ☰
        </button>
        <Link to="/dashboard" className="flex items-center cursor-pointer overflow-hidden group">
          <img 
            src="/images/euc_ico.png" 
            alt="Logo" 
            className="h-7 w-7 sm:h-9 sm:w-9 object-contain mr-3 shrink-0"
            referrerPolicy="no-referrer"
          />
          <span className="text-white font-bold tracking-wide whitespace-nowrap text-sm sm:text-base group-hover:text-yellow-500 transition-colors">
            EVA UROLOGY COMMUNITY
          </span>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <Link to="/activity" className="relative p-2 text-white hover:text-yellow-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </Link>
        <span className="hidden sm:inline text-sm font-medium text-gray-200 truncate max-w-[150px]">{currentUser?.name}</span>
        <Link 
          to="/profile"
          className="cursor-pointer hover:ring-2 hover:ring-yellow-400 rounded-full transition-all flex-shrink-0"
          title={getLabel(appConfig, "profile")}
        >
          <UserAvatar user={currentUser} size="sm" className="border border-gray-600" />
        </Link>
      </div>
    </header>
  );
}
