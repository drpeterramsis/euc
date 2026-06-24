// ─────────────────────────────────────────────
// FILE: src/pages/Directory.tsx
// PURPOSE: Renders the team/staff directory, matching coming soon & visibility rules with staff overrides.
// ─────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAppContext } from "../context/AppContext";
import { DirectoryCard } from "../components/DirectoryCard";
import { getLabel } from "../utils/labels";
import { getPageAccess } from "../utils/pageAccess";

import { getPageAccess as getCentralPageAccess } from "../lib/pageAccess";

export default function Directory() {
  const { users, appConfig, currentUser, content } = useAppContext() as any;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "doctor" | "staff">("all");

  const pageTitle = getLabel(appConfig, "directory");

  const centralAccess = { enabled: true, comingSoon: false };

  // ✅ ONLY use getPageAccess — NEVER check appConfig.pages directly
  const access = getPageAccess("directory", currentUser?.role, appConfig);

  // DEBUG — retrieve info during testing
  useEffect(() => {
    console.log("[Directory] role:", currentUser?.role, "| access:", access);
  }, [currentUser?.role, access]);

  // Hidden Check
  if (access === "hidden" || !centralAccess.enabled) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] font-sans">
          <p className="text-gray-400 text-sm font-bold">This page is not available.</p>
        </div>
      </Layout>
    );
  }

  // Coming Soon Check
  if (access === "coming-soon" || centralAccess.comingSoon) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center text-center px-6 py-20 min-h-[60vh] font-sans">
          <span className="text-6xl mb-5">🔒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {appConfig?.navLabels?.["directory"] ?? pageTitle}
          </h1>
          <p className="text-gray-500 mb-6 font-semibold text-sm max-w-xs">
            This feature is coming soon.
          </p>
        </div>
      </Layout>
    );
  }

  // Filter users — exclude admin from directory
  const filtered = users
    .filter(u => u.role !== "admin")
    .filter(u => roleFilter === "all" || u.role === roleFilter)
    .filter(u =>
      search === "" ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.title?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (roleFilter === "all") {
        const roleA = a.role === "doctor" ? 0 : 1;
        const roleB = b.role === "doctor" ? 0 : 1;
        if (roleA !== roleB) return roleA - roleB;
      }
      return (a.name || "").localeCompare(b.name || "");
    });

  const nonAdminUsers = users.filter(u => u.role !== "admin");

  return (
    <Layout>
      <div className="p-1 font-sans">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2
                       text-sm w-full sm:w-64 bg-white text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent cursor-text"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "doctor", "staff"] as const).map(r => {
            const count = r === "all"
              ? nonAdminUsers.length
              : nonAdminUsers.filter(u => u.role === r).length;

            return (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold
                            border transition-all flex items-center shadow-sm cursor-pointer ${
                  roleFilter === r
                    ? "bg-yellow-400 text-black border-yellow-400 font-bold"
                    : "bg-white text-gray-650 border-gray-300 hover:border-yellow-400 hover:text-black"
                }`}
              >
                {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid: 2 cols mobile, 3 tablet, 4 desktop */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm font-medium">
            No members found matching your search.
          </div>
        ) : roleFilter === "all" ? (
          <div className="space-y-10">
            {/* Doctors Section */}
            {filtered.some(u => u.role === "doctor") && (
              <div>
                <div className="mb-5">
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span>🩺 Doctors</span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-blue-100 normal-case tracking-normal">
                      {filtered.filter(u => u.role === "doctor").length}
                    </span>
                  </h2>
                  <div className="h-[2px] bg-gray-100 mt-2 rounded-full w-full"></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered
                    .filter(u => u.role === "doctor")
                    .map(user => (
                      <DirectoryCard key={user.id} user={user} currentUser={currentUser} />
                    ))}
                </div>
              </div>
            )}

            {/* Staff Section */}
            {filtered.some(u => u.role === "staff") && (
              <div>
                <div className="mb-5 pt-2">
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span>💼 Staff Members</span>
                    <span className="bg-amber-50 text-amber-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-amber-100 normal-case tracking-normal">
                      {filtered.filter(u => u.role === "staff").length}
                    </span>
                  </h2>
                  <div className="h-[2px] bg-gray-100 mt-2 rounded-full w-full"></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered
                    .filter(u => u.role === "staff")
                    .map(user => (
                      <DirectoryCard key={user.id} user={user} currentUser={currentUser} />
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(user => (
              <DirectoryCard key={user.id} user={user} currentUser={currentUser} />
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}
