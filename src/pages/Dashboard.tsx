// ─────────────────────────────────────────────
// FILE: src/pages/Dashboard.tsx
// PURPOSE: Renders the central dashboard for users with a dynamic Smart Countdown, quick actions, trip summary cards, and latest stories.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import MediaPostViewerModal from '../components/MediaPostViewerModal';
import { shouldShowOnDashboard } from '../utils/postVisibility';
import { getLabel } from '../utils/labels';
import SmartCountdown from '../components/SmartCountdown';
import DualClock from '../components/DualClock';
import { readJSON } from '../utils/github';
import GalleryCard from '../components/GalleryCard';
import { formatTimeAmPm, splitAmPm } from '../utils/timezone';
import CheckinsShortcut from '../components/CheckinsShortcut';
import WeatherForecast from '../components/WeatherForecast';

// ─────────────────────────────────────────────
// SUMMARY CARD FOR FLIGHTS (Compact, clean with icons)
// NOTE: "key" is allowed in TypeScript props type but NOT destructured to avoid React key prop warning.
// ─────────────────────────────────────────────
function FlightSummaryCard({ item }: { item: any; key?: any }) {
  const d = item.details;
  if (!d) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-xl flex-shrink-0">
        ✈️
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {item.direction === "outbound" ? "Flight to Prague" : "Flight to Cairo"}
        </p>
        <p className="text-sm font-bold text-gray-900 truncate">
          {d.flightNumber || "Flight details"}
        </p>
        <p className="text-xs text-gray-500 font-sans">
          {d.date && !isNaN(new Date(d.date).getTime())
            ? new Date(d.date).toLocaleDateString("en-GB", {
                weekday: "short", month: "short", day: "numeric"
              })
            : ""}
          {" · "}
          {(() => {
            if (!d.time) return "Scheduled";
            const formatted = formatTimeAmPm(d.time);
            const { digits, period } = splitAmPm(formatted);
            return (
              <span className="inline-flex items-center font-bold text-gray-800">
                {digits}
                {period && (
                  <span className="text-[10px] font-semibold ml-0.5 text-amber-500 tracking-wide">
                    {period}
                  </span>
                )}
              </span>
            );
          })()}
          {d.departureTerminal ? ` · Terminal ${d.departureTerminal}` : ""}
        </p>
      </div>
      <span className="text-xs bg-yellow-100 text-yellow-800 font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
        {item.direction === "outbound" ? "Dep" : "Ret"}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUMMARY CARD FOR HOTEL (Compact, clean staying details)
// NOTE: "key" is allowed in TypeScript props type but NOT destructured to avoid React key prop warning.
// ─────────────────────────────────────────────
function HotelSummaryCard({ item }: { item: any; key?: any }) {
  const d = item.details;
  if (!d) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
        🏨
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Hotel Stay
        </p>
        <p className="text-sm font-bold text-gray-900 truncate">
          {d.hotelName || "Prague Hotel"}
        </p>
        <p className="text-xs text-gray-500 font-sans">
          Check-in{" "}
          {d.checkInDate && !isNaN(new Date(d.checkInDate).getTime())
            ? new Date(d.checkInDate).toLocaleDateString("en-GB", {
                month: "short", day: "numeric"
              })
            : ""}
          {" · "}Check-out{" "}
          {d.checkOutDate && !isNaN(new Date(d.checkOutDate).getTime())
            ? new Date(d.checkOutDate).toLocaleDateString("en-GB", {
                month: "short", day: "numeric"
              })
            : ""}
        </p>
      </div>
      <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
        Prague
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser, users, media = [], galleries = [], tripInfo, appConfig } = useApp() as any;
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const navigate = useNavigate();

  // Dynamic state for auto-detected and custom schedule elements
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [countdownConfig, setCountdownConfig] = useState<any>({
    customMessage: "",
    showTimeline: true,
    customTimelineEntries: []
  });

  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;
  const fullUser = users.find(u => u.id === displayUser?.id) || displayUser;

  // Load dynamically on app mount to stay reactive without page refreshes
  useEffect(() => {
    readJSON("schedule.json")
      .then(setScheduleItems)
      .catch(() => setScheduleItems([]));

    readJSON("countdownConfig.json")
      .then(setCountdownConfig)
      .catch(() => {});
  }, []);

  const rawPosts = media
    .filter((p: any) => shouldShowOnDashboard(p, fullUser))
    .map((p: any) => ({ ...p, _type: 'post', sortByDate: p.createdAt || 0 }));
    
  const rawGalleries = (galleries || []).filter((g: any) =>
    g.showInLatest === true
  ).map((g: any) => ({ ...g, _type: 'gallery', sortByDate: g.publishedAt || 0 }));

  const dashboardMedia = [...rawPosts, ...rawGalleries]
    .sort((a, b) => new Date(b.sortByDate).getTime() - new Date(a.sortByDate).getTime())
    .slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6 flex flex-col">
        {/* Welcome greeting & Clocks */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest leading-none mb-1">
              Welcome Back,
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {fullUser?.name ?? "Guest"}
            </h1>
          </div>
          <DualClock />
        </div>
      
      {viewAs && (
        <div className="bg-yellow-105 text-yellow-800 p-3 text-center font-bold mb-6 rounded-lg relative shadow border border-yellow-200">
          ⚠️ Viewing as [{fullUser?.name || fullUser?.username}]
          <button
            onClick={() => {
              sessionStorage.removeItem("euc_view_as");
              window.location.reload();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-yellow-500 text-black px-3 py-1 rounded text-sm hover:bg-yellow-400 font-bold font-sans"
          >
            Exit Preview
          </button>
        </div>
      )}

      {currentUser?.role === "admin" && !viewAs && (
        <div className="bg-white text-gray-900 p-5 rounded-xl mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100">
          <h2 className="text-yellow-600 font-extrabold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
            <span>{"\uD83D\uDC51"}</span> Admin Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => navigate("/admin?tab=users")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-with-all text-gray-800 flex items-center justify-center gap-2">👥 Users</button>
            <button onClick={() => navigate("/admin?tab=schedule")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-with-all text-gray-800 flex items-center justify-center gap-2">📅 {getLabel(appConfig, "schedule")}</button>
            <button onClick={() => navigate("/admin?tab=sessions")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-with-all text-gray-800 flex items-center justify-center gap-2">🎓 {getLabel(appConfig, "sessions")}</button>
            <button onClick={() => navigate("/admin?tab=messages")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-all text-gray-800 flex items-center justify-center gap-2">💬 Messages</button>
            <button onClick={() => navigate("/admin?tab=media")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-all text-gray-800 flex items-center justify-center gap-2">{"\uD83D\uDCF8"} {getLabel(appConfig, "media")}</button>
            <button onClick={() => navigate("/admin?tab=features")} className="p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 border border-gray-100 font-bold text-xs transition-with-all text-gray-800 flex items-center justify-center gap-2">⚙️ Features</button>
          </div>
        </div>
      )}

      <WeatherForecast />

      <CheckinsShortcut user={fullUser} />

      {/* Latest Posts */}
      <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Latest Community Moments</h2>
            <button onClick={() => navigate("/media")} className="text-yellow-600 text-xs font-black hover:text-yellow-700 transition-colors uppercase tracking-widest">Explore {getLabel(appConfig, "media")} →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {dashboardMedia.map((post: any) => {
                if (post._type === 'gallery') {
                  return <GalleryCard key={post.id} album={post} />;
                }
                return (
                  <div key={post.id} className="group relative rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500" onClick={() => setSelectedPost(post)}>
                      <img src={post.imageDataUrl} alt={post.title} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700 font-sans" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute bottom-0 left-0 p-4">
                          <h4 className="text-white font-bold text-sm truncate drop-shadow-md">{post.title}</h4>
                          <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">{post.category}</p>
                      </div>
                  </div>
                );
            })}
            {dashboardMedia.length === 0 && <div className="col-span-full py-10 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 text-gray-400 font-bold italic font-sans">No stories shared yet...</div>}
        </div>
      </div>




      {/* Dynamic Smart Countdown from configuration & schedule */}
      <div className="mb-8">
        <SmartCountdown
          scheduleItems={scheduleItems}
          countdownConfig={countdownConfig}
        />
      </div>

            {/* Your Trip Logistics Compact Highlights */}
      {scheduleItems.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">
            Your Trip
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scheduleItems.map(item =>
              item.type === "hotel"
                ? <HotelSummaryCard  key={item.id} item={item} />
                : <FlightSummaryCard key={item.id} item={item} />
            )}
          </div>
        </div>
      )} 

      

      

      {selectedPost && (
        <MediaPostViewerModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}

      {/* Legacy/Classic Fallback Detail Row Section */}
      </div>
    </Layout>
  );
}
