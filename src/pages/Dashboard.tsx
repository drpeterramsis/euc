/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { currentUser, users } = useApp();
  const navigate = useNavigate();
  
  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;
  const fullUser = users.find(u => u.id === displayUser?.id) || displayUser;

  // Prague conference start date: 2025-09-10
  const conferenceStart = new Date("2025-09-10");
  const today = new Date();
  const diffTime = conferenceStart.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <Layout>
      {viewAs && (
        <div className="bg-yellow-500 text-black p-3 text-center font-bold mb-6 rounded-lg relative shadow">
          ⚠️ Viewing as [{fullUser.name || fullUser.username}]
          <button
            onClick={() => {
              sessionStorage.removeItem("euc_view_as");
              window.location.reload();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-yellow-500 px-3 py-1 rounded text-sm hover:bg-gray-800"
          >
            Exit Preview
          </button>
        </div>
      )}

      {currentUser?.role === "admin" && !viewAs && (
        <div className="bg-[#1a1a1a] text-white p-5 rounded-xl mb-8 shadow-lg border border-gray-800">
          <h2 className="text-yellow-500 font-bold mb-4 flex items-center gap-2">
            <span>👑</span> Admin Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => navigate("/admin?tab=users")} className="p-3 bg-gray-900 rounded hover:bg-gray-800 border border-gray-700 font-semibold text-sm transition-colors">👥 Manage Users</button>
            <button onClick={() => navigate("/admin?tab=schedule")} className="p-3 bg-gray-900 rounded hover:bg-gray-800 border border-gray-700 font-semibold text-sm transition-colors">📅 Edit Schedule</button>
            <button onClick={() => navigate("/admin?tab=schedule")} className="p-3 bg-gray-900 rounded hover:bg-gray-800 border border-gray-700 font-semibold text-sm transition-colors">🎓 Edit Sessions</button>
            <button onClick={() => navigate("/admin?tab=features")} className="p-3 bg-gray-900 rounded hover:bg-gray-800 border border-gray-700 font-semibold text-sm transition-colors">⚙️ Feature Control</button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {fullUser && <p className="mb-6">Welcome back, {fullUser.name}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Flight Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="font-bold mb-2">✈️ Next Flight</div>
          <p>{fullUser?.flightDetails?.flightNumber ?? "Not assigned yet"}</p>
        </div>
        
        {/* Hotel Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="font-bold mb-2">🏨 Hotel</div>
          <p>{fullUser?.hotel?.name ?? "Not assigned yet"}</p>
        </div>

        {/* Countdown Card */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="font-bold mb-2">⏳ Prague Countdown</div>
          <p className="text-2xl font-bold">{daysUntil > 0 ? `${daysUntil} days` : "Conference Ongoing"}</p>
        </div>
      </div>
    </Layout>
  );
}
