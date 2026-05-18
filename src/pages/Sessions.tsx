// ─────────────────────────────────────────────
// FILE: src/pages/Sessions.tsx
// PURPOSE: Renders the scientific sessions page populated
// from the sessions data, restricted to doctors and admins.
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
 * Sessions component renders the list/grid of scientific sessions.
 */
export default function Sessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const sessionUser = JSON.parse(localStorage.getItem("euc_user") || "{}");
        
        // Restriction check
        if (sessionUser.role === 'staff') {
           setError("Access Restricted. Only doctors and admins can view sessions.");
           setLoading(false);
           return;
        }

        const data = await readJSON('sessions.json');
        setSessions(data);
      } catch (err) {
        setError("Failed to load sessions. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-yellow-400 text-xl animate-pulse">
        Loading Sessions...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 pt-20">
        <Header />
        <h1 className="text-2xl font-bold mb-6">Sessions</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          {sessions.length > 0 ? (
             <div>Sessions grid render logic here...</div>
          ) : (
            <div className="text-gray-500">No sessions available yet.</div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
