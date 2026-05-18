// ─────────────────────────────────────────────
// FILE: src/pages/Profile.tsx
// PURPOSE: Renders the user profile page displaying
// personal, flight, and hotel details.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * Profile component renders user information and trip details.
 */
export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 pt-20">
        <Header />
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          {/* Avatar and Info section */}
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
            <div>
              <h2 className="text-xl font-bold">Dr. Ahmed Hassan</h2>
              <p className="text-gray-600">Doctor</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
