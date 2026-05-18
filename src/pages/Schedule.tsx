// ─────────────────────────────────────────────
// FILE: src/pages/Schedule.tsx
// PURPOSE: Renders the trip schedule page with
// timeline view of events.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * Schedule component renders the trip schedule timeline.
 */
export default function Schedule() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 pt-20">
        <Header />
        <h1 className="text-2xl font-bold mb-6">Trip Schedule</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          {/* Placeholder for Timeline view */}
          Timeline view...
        </div>
        <Footer />
      </div>
    </div>
  );
}
