/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { getLabel } from '../utils/labels';

/**
 * Profile component renders user information and trip details.
 */
export default function Profile() {
  const { currentUser, users, tripInfo, appConfig } = useApp();
  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;
  const fullUser = users.find(u => u.id === displayUser?.id) || displayUser;

  if (!fullUser) return <Layout>Loading...</Layout>;

  const vf = fullUser.visibleFields || {};
  const isVisible = (key: string) => vf[key] !== false;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{getLabel(appConfig, "profile")}</h1>
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-6 space-y-4 sm:space-y-0 pb-6 border-b border-gray-100">
          {(fullUser.photoUrl || fullUser.photo) ? (
            <img 
              src={fullUser.photoUrl || fullUser.photo} 
              className="w-24 h-24 rounded-full shadow-sm border border-gray-200 object-cover" 
              alt="Profile" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                e.currentTarget.nextElementSibling?.classList.add('flex');
              }}
            />
          ) : null}
          <div className={`${(fullUser.photoUrl || fullUser.photo) ? 'hidden' : 'flex'} w-24 h-24 bg-yellow-400 items-center justify-center rounded-full font-bold text-black border border-gray-200 text-3xl shadow-sm`}>
            {fullUser.name ? fullUser.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{fullUser.name}</h2>
            <p className="text-yellow-600 font-semibold tracking-wide text-sm mt-1">{fullUser.role.toUpperCase()}</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departure Trip Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
              <span className="text-xl">✈️</span>
              <span className="font-black text-gray-900 uppercase tracking-tight text-xs">Departure Trip</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="font-semibold">✈️ Departure</p>
                <p>Flight: {tripInfo.departure.flightNumber}</p>
                <p>Date: {tripInfo.departure.date}</p>
                <p>Terminal: {tripInfo.departure.terminal}</p>
              </div>
            </div>
          </div>

          {/* Arrival Trip Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
              <span className="text-xl">🛬</span>
              <span className="font-black text-gray-900 uppercase tracking-tight text-xs">Arrival Trip (Return)</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="font-semibold">✈️ Return</p>
                <p>Flight: {tripInfo.arrival.flightNumber}</p>
                <p>Date: {tripInfo.arrival.date}</p>
                <p>Terminal: {tripInfo.arrival.terminal}</p>
              </div>
            </div>
          </div>

          {/* Hotel Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden md:col-span-2">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
              <span className="text-xl">🏨</span>
              <span className="font-black text-gray-900 uppercase tracking-tight text-xs">Hotel Assignment</span>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-1">
                {/* Section label */}
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  🏨 Hotel
                </p>

                {/* Hotel name — plain, non-clickable */}
                <p className="font-semibold text-gray-900 text-base leading-snug">
                  {tripInfo.hotel.name}
                </p>

                {/* Map button — clearly separate from the name */}
                <a
                  href={tripInfo.hotel.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2
                             bg-yellow-400 hover:bg-yellow-500
                             text-black font-semibold text-sm
                             px-4 py-1.5 rounded-lg border border-yellow-500
                             transition-colors shadow-sm w-fit cursor-pointer"
                >
                  📍 View on Map
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
