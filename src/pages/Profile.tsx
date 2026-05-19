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

  const vf = fullUser.visibleFields || {};
  const isVisible = (key: string) => vf[key] !== false;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">My Profile</h1>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</span>
                  <span className="text-sm font-bold text-gray-900">{fullUser.flightDetails?.departure?.date || "TBA"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Flight NO.</span>
                  <span className="text-sm font-bold text-gray-900">{fullUser.flightDetails?.departure?.flightNumber || "TBA"}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-4">
                 <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">From Airport</span>
                  <span className="text-sm font-black text-gray-900">{fullUser.flightDetails?.departure?.departureAirport || "TBA"}</span>
                </div>
                 <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">To Airport</span>
                  <span className="text-sm font-black text-gray-900">{fullUser.flightDetails?.departure?.arrivalAirport || "PRG"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time</span>
                    <span className="text-sm font-bold text-gray-800">{fullUser.flightDetails?.departure?.time || "TBA"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Terminal/Gate</span>
                    <span className="text-sm font-bold text-gray-800">
                      {fullUser.flightDetails?.departure?.terminal ? `T${fullUser.flightDetails.departure.terminal}` : "TBA"} 
                      {fullUser.flightDetails?.departure?.gate ? ` / G${fullUser.flightDetails.departure.gate}` : ""}
                    </span>
                  </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</span>
                  <span className="text-sm font-bold text-gray-900">{fullUser.flightDetails?.arrival?.date || "TBA"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Flight NO.</span>
                  <span className="text-sm font-bold text-gray-900">{fullUser.flightDetails?.arrival?.flightNumber || "TBA"}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-4">
                 <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">From Airport</span>
                  <span className="text-sm font-black text-gray-900">{fullUser.flightDetails?.arrival?.departureAirport || "PRG"}</span>
                </div>
                 <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">To Airport</span>
                  <span className="text-sm font-black text-gray-900">{fullUser.flightDetails?.arrival?.arrivalAirport || "TBA"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time</span>
                    <span className="text-sm font-bold text-gray-800">{fullUser.flightDetails?.arrival?.time || "TBA"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Terminal/Gate</span>
                    <span className="text-sm font-bold text-gray-800">
                      {fullUser.flightDetails?.arrival?.terminal ? `T${fullUser.flightDetails.arrival.terminal}` : "TBA"} 
                      {fullUser.flightDetails?.arrival?.gate ? ` / G${fullUser.flightDetails.arrival.gate}` : ""}
                    </span>
                  </div>
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
              <div className="flex flex-col mb-6">
                <h3 className="text-lg font-black text-gray-900">{fullUser.hotel?.name || "Not Assigned"}</h3>
                <p className="text-xs text-gray-500 font-medium">{fullUser.hotel?.address || "Address will be announced soon"}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-In</span>
                    <span className="text-sm font-bold text-gray-900">{fullUser.hotel?.checkIn || "TBA"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-Out</span>
                    <span className="text-sm font-bold text-gray-900">{fullUser.hotel?.checkOut || "TBA"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Room</span>
                    <span className="text-sm font-bold text-gray-900">{fullUser.hotel?.roomNumber || "TBA"}</span>
                  </div>
              </div>
              {isVisible('mapsLink') && fullUser.hotel?.mapsLink && (
                  <div className="mt-6 border-t pt-4">
                  <a 
                    href={fullUser.hotel.mapsLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-xl font-bold transition-all text-xs shadow-lg uppercase tracking-widest"
                  >
                    📍 Open in Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
