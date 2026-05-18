/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

/**
 * Profile component renders user information and trip details.
 */
export default function Profile() {
  const { currentUser, users } = useApp();
  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;
  const fullUser = users.find(u => u.id === displayUser?.id) || displayUser;

  if (!fullUser) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-6 space-y-4 sm:space-y-0">
          <img src={fullUser.photo} className="w-24 h-24 rounded-full" alt="Profile" />
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold">{fullUser.name}</h2>
            <p className="text-gray-600">{fullUser.role.toUpperCase()}</p>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Flight Details */}
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2">✈️ Flight Details</h3>
            <p>{fullUser.flightDetails?.flightNumber ?? "Not assigned yet"}</p>
          </div>
          {/* Hotel Details */}
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2">🏨 Hotel Details</h3>
            <p>{fullUser.hotel?.name ?? "Not assigned yet"}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
