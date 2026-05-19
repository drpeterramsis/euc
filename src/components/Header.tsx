// ─────────────────────────────────────────────
// FILE: src/components/Header.tsx
// PURPOSE: Renders top header with hamburger menu.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useApp } from "../context/AppContext";

/**
 * Header component displays page context and user avatar.
 * Contains hamburger button for sidebar toggle on mobile.
 */
export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { currentUser } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-gray-800 flex items-center justify-between px-4 z-40 shadow-sm">
      <div className="flex items-center">
        <button className="lg:hidden p-2 text-white hover:text-yellow-500 transition-colors mr-2" onClick={onMenuClick}>☰</button>
        <img 
          src="/src/assets/images/euc_ico.png" 
          alt="Logo" 
          className="h-10 w-auto object-contain mr-3"
          referrerPolicy="no-referrer"
        />
        <div className="font-bold text-white hidden sm:block">EVA UROLOGY COMMUNITY</div>
        <div className="font-bold text-white sm:hidden">EUC</div>
      </div>
      <div className="flex items-center space-x-4">
        <span className="hidden sm:inline text-sm font-medium text-gray-200 truncate max-w-[150px]">{currentUser?.name}</span>
        {/* Placeholder for user avatar */}
        <img src={currentUser?.photo} className="w-10 h-10 bg-yellow-100 border border-gray-600 rounded-full object-cover shadow-sm" alt="Avatar" />
      </div>
    </header>
  );
}
