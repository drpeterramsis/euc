// ─────────────────────────────────────────────
// FILE: src/pages/Schedule.tsx
// PURPOSE: Renders the trip schedule page with
// timeline view of events filtered by roles.
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
 * Schedule component renders the trip schedule timeline.
 */
export default function Schedule() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await readJSON('schedule.json');
        
        // Filter schedule items by user role
        const sessionUser = JSON.parse(localStorage.getItem("euc_user") || "{}");
        const filtered = data.filter((item: any) => 
          item.accessRoles.includes(sessionUser.role) || 
          item.accessUserIds.includes(sessionUser.id)
        );
        
        setSchedule(filtered);
      } catch (err) {
        setError("Failed to load schedule. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-yellow-400 text-xl animate-pulse">
        Loading Schedule...
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
        <h1 className="text-2xl font-bold mb-6">Trip Schedule</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          {schedule.length > 0 ? (
            <div>Timeline view render logic here...</div>
          ) : (
            <div className="text-gray-500">No schedule available yet.</div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
