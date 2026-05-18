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

  const vf = fullUser?.visibleFields || {};
  const isVisible = (key: string) => vf[key] !== false;

  // Prague conference start date: 2025-09-10
  const conferenceStart = new Date("2025-09-10");
  const today = new Date();
  const diffTime = conferenceStart.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <Layout>
      {viewAs && (
        <div className="bg-yellow-100 text-yellow-800 p-3 text-center font-bold mb-6 rounded-lg relative shadow border border-yellow-200">
          ⚠️ Viewing as [{fullUser?.name || fullUser?.username}]
          <button
            onClick={() => {
              sessionStorage.removeItem("euc_view_as");
              window.location.reload();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-yellow-500 text-black px-3 py-1 rounded text-sm hover:bg-yellow-400 font-bold"
          >
            Exit Preview
          </button>
        </div>
      )}

      {currentUser?.role === "admin" && !viewAs && (
        <div className="bg-white text-gray-900 p-5 rounded-xl mb-8 shadow-md border border-gray-200">
          <h2 className="text-yellow-600 font-bold mb-4 flex items-center gap-2">
            <span>👑</span> Admin Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => navigate("/admin?tab=users")} className="p-3 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200 font-semibold text-sm transition-colors text-gray-800">👥 Manage Users</button>
            <button onClick={() => navigate("/admin?tab=schedule")} className="p-3 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200 font-semibold text-sm transition-colors text-gray-800">📅 Edit Schedule</button>
            <button onClick={() => navigate("/admin?tab=schedule")} className="p-3 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200 font-semibold text-sm transition-colors text-gray-800">🎓 Edit Sessions</button>
            <button onClick={() => navigate("/admin?tab=features")} className="p-3 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200 font-semibold text-sm transition-colors text-gray-800">⚙️ Feature Control</button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 text-gray-900">Dashboard</h1>
      {fullUser && <p className="mb-6 text-gray-700">Welcome back, {fullUser.name}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Flight Card */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
          <div className="font-bold mb-4 text-lg border-b pb-2 text-gray-900 flex items-center gap-2">
            <span>✈️</span> Flight Details
          </div>
          
          <div className="space-y-3 text-sm text-gray-700">
            {isVisible('flightNumber') && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs">Departure Flight</span>
                <span className="font-semibold">{fullUser?.flightDetails?.flightNumber || "Not assigned"}</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {isVisible('departureDate') && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Departure Date</span>
                  <span className="font-medium">{fullUser?.flightDetails?.departureDate || "-"}</span>
                </div>
              )}
              {isVisible('departureTime') && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Departure Time</span>
                  <span className="font-medium">{fullUser?.flightDetails?.departureTime || "-"}</span>
                </div>
              )}
              {isVisible('departureAirport') && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Dep Airport</span>
                  <span className="font-medium">{fullUser?.flightDetails?.departureAirport || "-"}</span>
                </div>
              )}
              {isVisible('arrivalAirport') && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Arr Airport</span>
                  <span className="font-medium">{fullUser?.flightDetails?.arrivalAirport || "-"}</span>
                </div>
              )}
              {isVisible('arrivalTime') && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Arrival Time</span>
                  <span className="font-medium">{fullUser?.flightDetails?.arrivalTime || "-"}</span>
                </div>
              )}
            </div>

            {(fullUser?.flightDetails?.returnFlight || fullUser?.flightDetails?.returnDate) && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex flex-col mb-2">
                  <span className="text-gray-500 text-xs">Return Flight</span>
                  <span className="font-semibold">{fullUser?.flightDetails?.returnFlight || "Not assigned"}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Return Date</span>
                    <span className="font-medium">{fullUser?.flightDetails?.returnDate || "-"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Return Time</span>
                    <span className="font-medium">{fullUser?.flightDetails?.returnTime || "-"}</span>
                  </div>
                </div>
              </div>
            )}
            
            {!isVisible('flightNumber') && !isVisible('departureDate') && !isVisible('departureAirport') && (
              <p className="text-gray-500 italic">Flight details are currently hidden.</p>
            )}
          </div>
        </div>
        
        {/* Hotel Card */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex flex-col">
          <div className="font-bold mb-4 text-lg border-b pb-2 text-gray-900 flex items-center gap-2">
            <span>🏨</span> Hotel Details
          </div>
          <div className="space-y-3 text-sm text-gray-700 flex-1">
            {isVisible('hotelName') ? (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs">Hotel Name</span>
                <span className="font-semibold">{fullUser?.hotel?.name || "Not assigned"}</span>
              </div>
            ) : <span className="text-gray-500 italic">Hotel info is private</span>}

            {isVisible('hotelAddress') && fullUser?.hotel?.address && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs">Address</span>
                <span className="font-medium">{fullUser.hotel.address}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {isVisible('checkIn') && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Check-In</span>
                  <span className="font-medium">{fullUser?.hotel?.checkIn || "-"}</span>
                </div>
              )}
              {isVisible('checkOut') && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Check-Out</span>
                  <span className="font-medium">{fullUser?.hotel?.checkOut || "-"}</span>
                </div>
              )}
            </div>

            {isVisible('roomNumber') && fullUser?.hotel?.roomNumber && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs">Room Number</span>
                <span className="font-medium">{fullUser.hotel.roomNumber}</span>
              </div>
            )}
          </div>
          
          {isVisible('mapsLink') && fullUser?.hotel?.mapsLink && (
            <a 
              href={fullUser.hotel.mapsLink} 
              target="_blank" 
              rel="noreferrer"
              className="mt-4 block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Google Maps
            </a>
          )}
        </div>

        {/* Countdown Card */}
        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-l-yellow-500">
          <div className="font-bold mb-4 text-lg border-b pb-2 text-gray-900 flex items-center gap-2">
            <span>⏳</span> Prague Countdown
          </div>
          <div className="flex flex-col items-center justify-center h-full pb-8">
            <span className="text-5xl font-extrabold text-yellow-500 drop-shadow-sm">
              {daysUntil > 0 ? daysUntil : "0"}
            </span>
            <span className="text-gray-500 font-medium mt-2">{daysUntil > 0 ? "Days Remaining" : "Conference Ongoing"}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
