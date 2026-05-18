// ─────────────────────────────────────────────
// FILE: src/pages/Sessions.tsx
// PURPOSE: Renders the scientific sessions page populated
// from the sessions data.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * Sessions component renders the list/grid of scientific sessions.
 */
export default function Sessions() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 pt-20">
        <Header />
        <h1 className="text-2xl font-bold mb-6">Sessions</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          {/* Placeholder for Sessions grid */}
          Sessions grid...
        </div>
        <Footer />
      </div>
    </div>
  );
}
