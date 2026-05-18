// ─────────────────────────────────────────────
// FILE: src/pages/Admin.tsx
// PURPOSE: Renders the Admin User Management panel.
// Restricted to admin roles.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { readJSON, writeJSON } from '../utils/github';

/**
 * Admin component renders user management table and controls.
 */
export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const sessionUser = JSON.parse(localStorage.getItem("euc_user") || "{}");
        
        if (sessionUser.role !== 'admin') {
           setIsAdmin(false);
           setLoading(false);
           return;
        }
        setIsAdmin(true);

        const data = await readJSON('users.json');
        setUsers(data);
      } catch (err) {
        setError("Failed to load users. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-yellow-400 text-xl animate-pulse">
        Loading Admin Panel...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 pt-20">
        <Header />
        <h1 className="text-2xl font-bold mb-6">User Management (Admin)</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          {/* User CRUD Table placeholder */}
          <table className="w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>{u.isActive ? "Active" : "Inactive"}</td>
                  <td><button>Edit</button> <button>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Footer />
      </div>
    </div>
  );
}
