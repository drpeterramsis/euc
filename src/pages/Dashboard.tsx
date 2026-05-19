/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import MediaPostViewerModal from '../components/MediaPostViewerModal';
import { shouldShowOnDashboard } from '../utils/postVisibility';

export default function Dashboard() {
  const { currentUser, users, media = [] } = useApp();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const navigate = useNavigate();
  
  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;
  const fullUser = users.find(u => u.id === displayUser?.id) || displayUser;

  const vf = fullUser?.visibleFields || {};
  const isVisible = (key: string) => vf[key] !== false;

  const dashboardMedia = [...media]
    .filter(p => shouldShowOnDashboard(p, fullUser))
    .sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime())
    .slice(0, 3);

  // Prague conference flight departure: 2026-06-25 12:50 PM
  const conferenceDeparture = new Date("2026-06-25T12:50:00");
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, mins: number, secs: number, finished: boolean}>({
    days: 0, hours: 0, mins: 0, secs: 0, finished: false
  });

  useState(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = conferenceDeparture.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft(prev => ({ ...prev, finished: true }));
        clearInterval(timer);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days: d, hours: h, mins: m, secs: s, finished: false });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flightDeparture = fullUser?.flightDetails?.departure || {};
  const flightArrival = fullUser?.flightDetails?.arrival || {};

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
        <div className="bg-white text-gray-900 p-5 rounded-xl mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100">
          <h2 className="text-yellow-600 font-extrabold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
            <span>👑</span> Admin Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => navigate("/admin?tab=users")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-all text-gray-800 flex items-center justify-center gap-2">👥 Users</button>
            <button onClick={() => navigate("/admin?tab=schedule")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-all text-gray-800 flex items-center justify-center gap-2">📅 Schedule</button>
            <button onClick={() => navigate("/admin?tab=schedule")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-all text-gray-800 flex items-center justify-center gap-2">🎓 Sessions</button>
            <button onClick={() => navigate("/admin?tab=features")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-all text-gray-800 flex items-center justify-center gap-2">⚙️ Features</button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
        {fullUser && <p className="text-gray-500 font-medium">Welcome back, <span className="text-gray-900">{fullUser.name}</span></p>}
      </div>

      {/* Countdown Redesign */}
      <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left transition-all">
            <h2 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">
              {timeLeft.finished ? "Status" : (timeLeft.days > 0 ? "Until Conference" : "Until Departure")}
            </h2>
            <div className="text-2xl font-black text-gray-900">
              {timeLeft.finished ? "Safe Travels! 🎉" : "Prague 2026 Countdown"}
            </div>
          </div>

          <div className="flex gap-2 sm:gap-4">
            {timeLeft.finished ? (
              <div className="bg-yellow-50 text-yellow-700 px-6 py-4 rounded-xl font-black text-xl border border-yellow-200">
                Conference has started! Safe travels 🎉
              </div>
            ) : (
              <>
                {timeLeft.days > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-black border border-gray-800 rounded-xl flex items-center justify-center text-[#FFBF00] text-2xl sm:text-3xl font-black shadow-lg">
                        {timeLeft.days}
                      </div>
                      <span className="text-[10px] font-bold text-yellow-500/80 mt-2 uppercase tracking-tighter">Days</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-black border border-gray-800 rounded-xl flex items-center justify-center text-[#FFBF00] text-2xl sm:text-3xl font-black shadow-lg">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-bold text-yellow-500/80 mt-2 uppercase tracking-tighter">Hours</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-black border border-gray-800 rounded-xl flex items-center justify-center text-[#FFBF00] text-2xl sm:text-3xl font-black shadow-lg">
                        {String(timeLeft.mins).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-bold text-yellow-500/80 mt-2 uppercase tracking-tighter">Mins</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                     <div className="flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-black border border-gray-800 rounded-xl flex items-center justify-center text-[#FFBF00] text-2xl sm:text-3xl font-black shadow-lg">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-bold text-yellow-500/80 mt-2 uppercase tracking-tighter">Hours</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-black border border-gray-800 rounded-xl flex items-center justify-center text-[#FFBF00] text-2xl sm:text-3xl font-black shadow-lg">
                        {String(timeLeft.mins).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-bold text-yellow-500/80 mt-2 uppercase tracking-tighter">Mins</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-black border border-gray-800 rounded-xl flex items-center justify-center text-[#FFBF00] text-2xl sm:text-3xl font-black shadow-lg animate-pulse">
                        {String(timeLeft.secs).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-bold text-yellow-500/80 mt-2 uppercase tracking-tighter">Secs</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Latest Posts */}
      <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Latest Community Moments</h2>
            <button onClick={() => navigate("/media")} className="text-yellow-600 text-xs font-black hover:text-yellow-700 transition-colors uppercase tracking-widest">Explore Gallery →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {dashboardMedia.map((post: any) => (
                <div key={post.id} className="group relative rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500" onClick={() => setSelectedPost(post)}>
                    <img src={post.imageDataUrl} alt={post.title} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute bottom-0 left-0 p-4">
                        <h4 className="text-white font-bold text-sm truncate drop-shadow-md">{post.title}</h4>
                        <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">{post.category}</p>
                    </div>
                </div>
            ))}
            {dashboardMedia.length === 0 && <div className="col-span-full py-10 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 text-gray-400 font-bold italic">No stories shared yet...</div>}
        </div>
      </div>

      {selectedPost && (
        <MediaPostViewerModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Departure Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✈️</span>
              <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Departure Trip</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">To Prague Conference</p>
              </div>
            </div>
            {flightDeparture.flightNumber && <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-black">{flightDeparture.flightNumber}</span>}
          </div>
          
          <div className="p-6">
            {!flightDeparture.flightNumber ? (
              <p className="text-gray-400 italic text-sm text-center py-6">Departure flight details not assigned yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</span>
                  <span className="text-sm font-bold text-gray-900">{flightDeparture.date || "TBA"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Flight Number</span>
                  <span className="text-sm font-bold text-gray-900">{flightDeparture.flightNumber || "TBA"}</span>
                </div>
                <div className="flex flex-col bg-gray-50 p-3 rounded-xl">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">From</span>
                  <span className="text-sm font-black text-gray-900">{flightDeparture.departureAirport || "TBA"}</span>
                </div>
                <div className="flex flex-col bg-gray-50 p-3 rounded-xl">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">To</span>
                  <span className="text-sm font-black text-gray-900">{flightDeparture.arrivalAirport || "PRG"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Departure Time</span>
                  <span className="text-sm font-bold text-gray-800">{flightDeparture.time || "TBA"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Terminal / Gate</span>
                  <span className="text-sm font-bold text-gray-800">
                    {flightDeparture.terminal ? `T${flightDeparture.terminal}` : "TBA"} {flightDeparture.gate ? `/ G${flightDeparture.gate}` : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Arrival Card (Return) */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛬</span>
              <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Arrival Trip (Return)</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Back Home Safely</p>
              </div>
            </div>
            {flightArrival.flightNumber && <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-black">{flightArrival.flightNumber}</span>}
          </div>
          
          <div className="p-6">
            {!flightArrival.flightNumber ? (
              <p className="text-gray-400 italic text-sm text-center py-6">Return flight details not assigned yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</span>
                  <span className="text-sm font-bold text-gray-900">{flightArrival.date || "TBA"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Flight Number</span>
                  <span className="text-sm font-bold text-gray-900">{flightArrival.flightNumber || "TBA"}</span>
                </div>
                <div className="flex flex-col bg-gray-50 p-3 rounded-xl">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">From Airport</span>
                  <span className="text-sm font-black text-gray-900">{flightArrival.departureAirport || "PRG"}</span>
                </div>
                <div className="flex flex-col bg-gray-50 p-3 rounded-xl">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">To Airport</span>
                  <span className="text-sm font-black text-gray-900">{flightArrival.arrivalAirport || "TBA"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Departure Time</span>
                  <span className="text-sm font-bold text-gray-800">{flightArrival.time || "TBA"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Terminal / Gate</span>
                  <span className="text-sm font-bold text-gray-800">
                    {flightArrival.terminal ? `T${flightArrival.terminal}` : "TBA"} {flightArrival.gate ? `/ G${flightArrival.gate}` : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hotel Details */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col md:col-span-2">
          <div className="p-5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
            <span className="text-2xl">🏨</span>
            <div>
              <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Accommodation Details</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Your Stay in Prague</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hotel Name</span>
                <span className="text-xl font-black text-gray-900">{fullUser?.hotel?.name || "Not assigned"}</span>
                <p className="text-sm text-gray-500 font-medium mt-1">{fullUser?.hotel?.address || "Address will be provided soon"}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="flex flex-col p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                  <span className="text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-1">Check-In</span>
                  <span className="text-sm font-black text-yellow-900">{fullUser?.hotel?.checkIn || "TBA"}</span>
                </div>
                <div className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Check-Out</span>
                  <span className="text-sm font-black text-gray-900">{fullUser?.hotel?.checkOut || "TBA"}</span>
                </div>
                <div className="flex flex-col p-3 bg-black text-white rounded-xl shadow-lg">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Room</span>
                  <span className="text-sm font-black">{fullUser?.hotel?.roomNumber || "TBA"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4">
              {isVisible('mapsLink') && fullUser?.hotel?.mapsLink ? (
                <a 
                  href={fullUser.hotel.mapsLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full bg-black text-white hover:bg-gray-800 py-4 rounded-xl font-black text-center transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  📍 Open in Maps
                </a>
              ) : (
                <div className="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-black text-center uppercase tracking-widest text-xs border border-dashed border-gray-200">
                  Map View Unavailable
                </div>
              )}
              <p className="text-[9px] text-gray-400 font-bold text-center uppercase leading-tight">Please have your ID ready <br/> upon check-in</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
