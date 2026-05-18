/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

/**
 * Dashboard component renders the main overview page,
 * personalizing the welcome message for the logged-in user.
 */
export default function Dashboard() {
  const { currentUser, users, schedule, sessions } = useApp();
  
  // Find full user profile
  const fullUser = users.find(u => u.id === currentUser?.id);

  // Prague conference start date: 2025-09-10
  const conferenceStart = new Date("2025-09-10");
  const today = new Date();
  const diffTime = conferenceStart.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <Layout>
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
