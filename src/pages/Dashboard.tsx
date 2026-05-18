// ─────────────────────────────────────────────
// FILE: src/pages/Dashboard.tsx
// PURPOSE: Renders the dashboard page, providing
// a quick overview of essential trip info.
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
 * Dashboard component renders the main overview page,
 * personalizing the welcome message for the logged-in user.
 */
export default function Dashboard() {
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
        setError("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-yellow-400 text-xl animate-pulse">
        Loading EUC...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8 pt-20">
        <Header />
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {currentUser && <p>Welcome back, {currentUser.name}</p>}
        <Footer />
      </div>
    </div>
  );
}
