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
    <header className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-gray-800 flex items-center justify-between px-4 z-40">
      <button className="lg:hidden p-2 text-white" onClick={onMenuClick}>☰</button>
      <div className="font-semibold text-white ml-2 lg:ml-6 ml-0">EUC Conference Portal</div>
      <div className="flex items-center space-x-4">
        <span className="hidden sm:inline text-sm truncate max-w-[150px] text-white">{currentUser?.name}</span>
        {/* Placeholder for user avatar */}
        <img src={currentUser?.photo} className="w-10 h-10 bg-yellow-500 rounded-full object-cover" alt="Avatar" />
      </div>
    </header>
  );
}
