// ─────────────────────────────────────────────
// FILE: src/components/Header.tsx
// PURPOSE: Renders the top header bar component.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Header component displays page context and user avatar.
 */
export default function Header() {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      <div className="font-semibold">EUC Conference Portal</div>
      <div className="flex items-center space-x-4">
        <span></span>
        {/* Placeholder for user avatar */}
        <div className="w-10 h-10 bg-yellow-500 rounded-full"></div>
      </div>
    </header>
  );
}
