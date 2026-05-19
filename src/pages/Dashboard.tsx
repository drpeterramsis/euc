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
import { getLabel } from '../utils/labels';

export default function Dashboard() {
  const { currentUser, users, media = [], tripInfo, appConfig } = useApp();
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

  // Prague conference flight departure
  const conferenceDeparture = new Date(`${tripInfo.departure.date} 12:50:00`);
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
            <button onClick={() => navigate("/admin?tab=schedule")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-all text-gray-800 flex items-center justify-center gap-2">📅 {getLabel(appConfig, "schedule")}</button>
            <button onClick={() => navigate("/admin?tab=schedule")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-all text-gray-800 flex items-center justify-center gap-2">🎓 {getLabel(appConfig, "sessions")}</button>
            <button onClick={() => navigate("/admin?tab=features")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-all text-gray-800 flex items-center justify-center gap-2">⚙️ Features</button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm font-normal text-gray-500 leading-tight">
          Welcome Back,
        </p>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">
          {fullUser?.name ?? "Guest"}
        </h1>
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
            <button onClick={() => navigate("/media")} className="text-yellow-600 text-xs font-black hover:text-yellow-700 transition-colors uppercase tracking-widest">Explore {getLabel(appConfig, "media")} →</button>
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
          </div>
          
          <div className="p-6">
            <div>
              <p className="font-semibold">✈️ Departure</p>
              <p>Flight: {tripInfo.departure.flightNumber}</p>
              <p>Date: {tripInfo.departure.date}</p>
              <p>Terminal: {tripInfo.departure.terminal}</p>
            </div>
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
          </div>
          
          <div className="p-6">
            <div>
              <p className="font-semibold">✈️ Return</p>
              <p>Flight: {tripInfo.arrival.flightNumber}</p>
              <p>Date: {tripInfo.arrival.date}</p>
              <p>Terminal: {tripInfo.arrival.terminal}</p>
            </div>
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
          
          <div className="p-6">
            <div>
              <p className="font-semibold">🏨 Hotel</p>
              <p>Name: <a href={tripInfo.hotel.mapUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline">{tripInfo.hotel.name}</a></p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
