// ─────────────────────────────────────────────
// FILE: src/pages/Profile.tsx
// PURPOSE: Renders the user profile page displaying
// personal, flight, and hotel details.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { readJSON } from '../utils/github';

/**
 * Profile component renders user information and trip details.
 * Fetches user's full profile based on ID from session.
 */
export default function Profile() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        // Get logged-in user from session
        const sessionUser = JSON.parse(localStorage.getItem("euc_user") || "{}");
        if (!sessionUser.id) throw new Error("No session found");

        // Find this user's full profile from users.json by matching id
        const users = await readJSON('users.json');
        const fullUser = users.find((u: any) => u.id === sessionUser.id);
        setCurrentUser(fullUser);
      } catch (err) {
        setError("Failed to load profile. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-yellow-400 text-xl animate-pulse">
        Loading Profile...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );

  if (!currentUser) return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        No profile data available.
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 pt-20">
        <Header />
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          {/* Avatar and Info section */}
          <div className="flex items-center space-x-6">
            <img src={currentUser.photo} className="w-24 h-24 rounded-full" alt="Profile" />
            <div>
              <h2 className="text-xl font-bold">{currentUser.name}</h2>
              <p className="text-gray-600">{currentUser.role.toUpperCase()}</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
