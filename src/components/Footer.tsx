/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FILE: src/components/Footer.tsx
 * PURPOSE: Renders the footer component displayed on all pages.
 */
export default function Footer() {
  /**
   * Footer component renders copyright, app name, conference info, and version.
   */
  return (
    <footer className="fixed bottom-0 left-64 right-0 p-4 border-t border-gray-200 bg-white text-center text-sm text-gray-500">
      © 2025 EUC – EVA URO CLUB | Prague Conference | v1.2
    </footer>
  );
}
