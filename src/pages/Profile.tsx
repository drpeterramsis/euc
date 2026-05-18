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
          <img src={fullUser.photo} className="w-24 h-24 rounded-full shadow-sm border border-gray-200" alt="Profile" />
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{fullUser.name}</h2>
            <p className="text-yellow-600 font-semibold tracking-wide text-sm mt-1">{fullUser.role.toUpperCase()}</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flight Details */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold mb-4 text-lg border-b border-gray-200 pb-2 text-gray-900 flex items-center gap-2">
              <span>✈️</span> Flight Details
            </h3>
            
            <div className="space-y-3 text-sm text-gray-700">
              {isVisible('flightNumber') && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">Departure Flight</span>
                  <span className="font-semibold text-base">{fullUser.flightDetails?.flightNumber || "Not assigned"}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {isVisible('departureDate') && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Departure Date</span>
                    <span className="font-medium">{fullUser.flightDetails?.departureDate || "-"}</span>
                  </div>
                )}
                {isVisible('departureTime') && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Departure Time</span>
                    <span className="font-medium">{fullUser.flightDetails?.departureTime || "-"}</span>
                  </div>
                )}
                {isVisible('departureAirport') && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Dep. Airport</span>
                    <span className="font-medium">{fullUser.flightDetails?.departureAirport || "-"}</span>
                  </div>
                )}
                {isVisible('arrivalAirport') && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Arr. Airport</span>
                    <span className="font-medium">{fullUser.flightDetails?.arrivalAirport || "-"}</span>
                  </div>
                )}
                {isVisible('arrivalTime') && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Arrival Time</span>
                    <span className="font-medium">{fullUser.flightDetails?.arrivalTime || "-"}</span>
                  </div>
                )}
              </div>

              {(fullUser.flightDetails?.returnFlight || fullUser.flightDetails?.returnDate) && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex flex-col mb-2">
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Return Flight</span>
                    <span className="font-semibold text-base">{fullUser.flightDetails?.returnFlight || "Not assigned"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Return Date</span>
                      <span className="font-medium">{fullUser.flightDetails?.returnDate || "-"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Return Time</span>
                      <span className="font-medium">{fullUser.flightDetails?.returnTime || "-"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Hotel Details */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold mb-4 text-lg border-b border-gray-200 pb-2 text-gray-900 flex items-center gap-2">
              <span>🏨</span> Hotel Details
            </h3>
            
            <div className="space-y-4 text-sm text-gray-700">
              {isVisible('hotelName') && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">Hotel Name</span>
                  <span className="font-semibold text-base">{fullUser.hotel?.name || "Not assigned"}</span>
                </div>
              )}

              {isVisible('hotelAddress') && fullUser.hotel?.address && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Address</span>
                  <span className="font-medium">{fullUser.hotel.address}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {isVisible('checkIn') && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Check-In</span>
                    <span className="font-medium">{fullUser.hotel?.checkIn || "-"}</span>
                  </div>
                )}
                {isVisible('checkOut') && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Check-Out</span>
                    <span className="font-medium">{fullUser.hotel?.checkOut || "-"}</span>
                  </div>
                )}
              </div>

              {isVisible('roomNumber') && fullUser.hotel?.roomNumber && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Room Number</span>
                  <span className="font-medium">{fullUser.hotel.roomNumber}</span>
                </div>
              )}

              {isVisible('mapsLink') && fullUser.hotel?.mapsLink && (
                <div className="pt-2">
                  <a 
                    href={fullUser.hotel.mapsLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
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
