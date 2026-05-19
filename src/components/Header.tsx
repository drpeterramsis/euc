// ─────────────────────────────────────────────
// FILE: src/components/Header.tsx
// PURPOSE: Renders top header with hamburger menu.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useApp } from "../context/AppContext";
import { Link } from "react-router-dom";

/**
 * Header component displays page context and user avatar.
 * Contains hamburger button for sidebar toggle on mobile.
 */
export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { currentUser } = useApp();

  const userPhoto = currentUser?.photoUrl || currentUser?.photo;
  const initials = currentUser?.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : "U";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-gray-800 flex items-center justify-between px-4 z-40 shadow-sm">
      <div className="flex items-center overflow-hidden">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-white hover:text-yellow-400 transition-colors p-2 mr-2"
          aria-label="Toggle menu"
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
        <span className="hidden sm:inline text-sm font-medium text-gray-200 truncate max-w-[150px]">{currentUser?.name}</span>
        {userPhoto ? (
          <img 
            src={userPhoto} 
            className="w-10 h-10 bg-yellow-100 border border-gray-600 rounded-full object-cover shadow-sm" 
            alt="Avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
              e.currentTarget.nextElementSibling?.classList.add('flex');
            }}
          />
        ) : null}
        <div className={`${userPhoto ? 'hidden' : 'flex'} w-10 h-10 bg-yellow-400 items-center justify-center rounded-full font-bold text-black border border-gray-600`}>
          {initials}
        </div>
      </div>
    </header>
  );
}
