// ─────────────────────────────────────────────
// FILE: src/pages/Dashboard.tsx
// PURPOSE: Renders the dashboard page, providing
// a quick overview of essential trip info.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * Dashboard component renders the main overview page.
 */
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8 pt-20">
        <Header />
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Welcome back, Dr. Ahmed Hassan</p>
        <Footer />
      </div>
    </div>
  );
}
