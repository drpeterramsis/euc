// ─────────────────────────────────────────────
// FILE: src/pages/Admin.tsx
// PURPOSE: Renders the Admin User Management panel.
// Restricted to admin roles.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * Admin component renders user management table and controls.
 */
export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 pt-20">
        <Header />
        <h1 className="text-2xl font-bold mb-6">User Management (Admin)</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          {/* Placeholder for User table */}
          User table...
        </div>
        <Footer />
      </div>
    </div>
  );
}
