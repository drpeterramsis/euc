import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Admin Action Configuration ──────────────────────────────
const adminQuickActions = [
  { id: "users", label: "Users", description: "Manage app users", icon: "\uD83D\uDC65", iconBg: "bg-yellow-50", route: "/admin/users", countKey: "users" },
  { id: "posts", label: "Posts", description: "Manage news feed posts", icon: "\uD83D\uDCDD", iconBg: "bg-blue-50", route: "/admin/posts", countKey: "posts" },
  { id: "categories", label: "Categories", description: "Manage post categories", icon: "\uD83D\uDDC2\uFE0F", iconBg: "bg-purple-50", route: "/admin/categories", countKey: "categories" },
  { id: "sessions", label: "Sessions", description: "Manage conference sessions", icon: "\uD83C\uDFA4", iconBg: "bg-pink-50", route: "/admin/sessions", countKey: "sessions" },
  { id: "tripSchedule", label: "Schedule", description: "Edit daily agenda", icon: "\uD83D\uDDD3\uFE0F", iconBg: "bg-orange-50", route: "/admin/trip-schedule", countKey: null },
  { id: "flightHotel", label: "Flight & Hotel", description: "Edit trip logistics", icon: "\u2708\uFE0F", iconBg: "bg-sky-50", route: "/admin/flight-hotel", countKey: null },
  { id: "countdown", label: "Countdown", description: "Edit countdown & timeline", icon: "\u23F1\uFE0F", iconBg: "bg-green-50", route: "/admin/countdown", countKey: null },
  { id: "media", label: "Media", description: "Manage photos & videos", icon: "\uD83D\uDCF8", iconBg: "bg-rose-50", route: "/admin/media", countKey: "media" },
  { id: "directory", label: "Directory", description: "Manage staff directory", icon: "\uD83D\uDCD6", iconBg: "bg-indigo-50", route: "/admin/directory", countKey: "directory" },
  { id: "notifications", label: "Notifications", description: "Send push notifications", icon: "\uD83D\uDD14", iconBg: "bg-yellow-50", route: "/admin/notifications", countKey: null },
  { id: "appSettings", label: "App Settings", description: "Pages, labels, visibility", icon: "\u2699\uFE0F", iconBg: "bg-gray-100", route: "/admin/settings", countKey: null },
  { id: "appearance", label: "Appearance", description: "Theme, colors, branding", icon: "\uD83C\uDFA8", iconBg: "bg-fuchsia-50", route: "/admin/appearance", countKey: null },
];

const COUNT_SOURCES: Record<string, string> = {
  users:      "users.json",
  posts:      "posts.json",
  categories: "categories.json",
  sessions:   "sessions.json",
  media:      "media.json",
  directory:  "directory.json",
};

export default function AdminQuickActions() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const entries = Object.entries(COUNT_SOURCES);
    Promise.allSettled(
      entries.map(([key, file]) =>
        import('../utils/github').then(({ readJSON }) => 
          readJSON(file)
            .then(data => ({ key, count: Array.isArray(data) ? data.length : 0 }))
            .catch(() => ({ key, count: 0 }))
        )
      )
    ).then(results => {
      const newCounts: Record<string, number> = {};
      results.forEach(result => {
        if (result.status === "fulfilled") {
          newCounts[result.value.key] = result.value.count;
        }
      });
      setCounts(newCounts);
    });
  }, []);

  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Admin Quick Actions
        </p>
        <span className="text-xs text-gray-300">
          {adminQuickActions.length} shortcuts
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {adminQuickActions.map(action => {
          const count = action.countKey !== null ? counts[action.countKey] ?? null : null;
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.route)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left cursor-pointer hover:shadow-md hover:border-yellow-300 active:scale-95 transition-all group focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${action.iconBg} group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                {count !== null && (
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {action.label}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
