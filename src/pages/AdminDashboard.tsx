import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────
// FILE: src/pages/AdminDashboard.tsx
// PURPOSE: Admin home view carrying stats & quick action panel.
// ─────────────────────────────────────────────

interface AdminDashboardProps {
  onSelectTab: (tab: string) => void;
}

export default function AdminDashboard({ onSelectTab }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [usersCount, setUsersCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [categoriesCount, setCategoriesCount] = useState<number>(0);
  const [scheduleCount, setScheduleCount] = useState<number>(0);
  const [sessionsCount, setSessionsCount] = useState<number>(0);

  useEffect(() => {
    // 1. Fetch Users Count
    fetch("/data/users.json")
      .then(r => r.json())
      .then(data => setUsersCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setUsersCount(0));

    // 2. Fetch Posts Count (reads media.json where posts are stored)
    fetch("/data/media.json")
      .then(r => r.json())
      .then(data => setPostsCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {
        // Fallback to posts.json if media.json is not resolved
        fetch("/data/posts.json")
          .then(r => r.json())
          .then(data2 => setPostsCount(Array.isArray(data2) ? data2.length : 0))
          .catch(() => setPostsCount(0));
      });

    // 3. Fetch Categories Count (from settings.json categories fields)
    fetch("/data/settings.json")
      .then(r => r.json())
      .then(data => {
        const schedCount = Array.isArray(data?.scheduleCategories) ? data.scheduleCategories.length : 0;
        const mediaCount = Array.isArray(data?.mediaCategories) ? data.mediaCategories.length : 0;
        setCategoriesCount(schedCount + mediaCount);
      })
      .catch(() => {
        // Fallback to categories.json
        fetch("/data/categories.json")
          .then(r => r.json())
          .then(data2 => setCategoriesCount(Array.isArray(data2) ? data2.length : 0))
          .catch(() => setCategoriesCount(0));
      });

    // 4. Fetch Schedule Count
    fetch("/data/schedule.json")
      .then(r => r.json())
      .then(data => setScheduleCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setScheduleCount(0));

    // 5. Fetch Sessions Count
    fetch("/data/sessions.json")
      .then(r => r.json())
      .then(data => setSessionsCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setSessionsCount(0));
  }, []);

  return (
    <div className="space-y-8">
      {/* Overview Intro */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Welcome to your Admin Hub</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-2xl font-medium">
          Control application properties, manage passenger documents, configure live schedules, broadcast announcements, and monitor active user sessions from a single unified panel.
        </p>
      </div>

      {/* Grid of Control Cards */}
      <h3 className="font-extrabold text-sm text-gray-400 uppercase tracking-widest mb-1">Administrative Quick Panel</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Users Control Card */}
        <div
          onClick={() => onSelectTab("users")}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-xl group-hover:bg-yellow-105 transition-colors">
              👥
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Users</p>
              <p className="text-xs text-gray-400">Manage user credentials & roles</p>
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{usersCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Total members registered</p>
        </div>

        {/* Schedule & Sessions Card */}
        <div
          onClick={() => onSelectTab("schedule")}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl group-hover:bg-blue-105 transition-colors">
              📅
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Schedule & Sessions</p>
              <p className="text-xs text-gray-400">Live events planner</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-2xl font-black text-gray-900">{scheduleCount}</p>
              <p className="text-[10px] text-gray-405 font-bold uppercase tracking-tight">Events</p>
            </div>
            <div className="border-l border-gray-200 pl-4">
              <p className="text-2xl font-black text-gray-900">{sessionsCount}</p>
              <p className="text-[10px] text-gray-405 font-bold uppercase tracking-tight">Lectures</p>
            </div>
          </div>
        </div>

        {/* Posts Management Card */}
        <div
          onClick={() => navigate("/admin/posts")}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl group-hover:bg-green-105 transition-colors">
              📝
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Posts</p>
              <p className="text-xs text-gray-400">Manage News Feed posts</p>
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{postsCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Total stories shared</p>
        </div>

        {/* Categories Management Card */}
        <div
          onClick={() => navigate("/admin/categories")}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl group-hover:bg-purple-105 transition-colors">
              🗂️
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Categories</p>
              <p className="text-xs text-gray-400">Manage post categories</p>
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{categoriesCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Total distinct categories</p>
        </div>

        {/* Trip Info Card */}
        <div
          onClick={() => onSelectTab("tripInfo")}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl group-hover:bg-indigo-105 transition-colors">
              ✈️
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Trip Info</p>
              <p className="text-xs text-gray-400">Flights & accommodation</p>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-700">Flight & Hotel</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Edit transit data</p>
        </div>

        {/* Feature Flags Card */}
        <div
          onClick={() => onSelectTab("features")}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl group-hover:bg-orange-105 transition-colors">
              ⚙️
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Feature Flags</p>
              <p className="text-xs text-gray-400">Role level feature views</p>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-700">Access Policies</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Manage permission matrix</p>
        </div>

        {/* App Settings Card */}
        <div
          onClick={() => onSelectTab("appConfig")}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-xl group-hover:bg-pink-105 transition-colors">
              🛠️
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">App Settings</p>
              <p className="text-xs text-gray-400">Title, order & navigation</p>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-700">System Config</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Modify layouts & names</p>
        </div>

      </div>

    </div>
  );
}
