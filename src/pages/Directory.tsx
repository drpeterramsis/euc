// ─────────────────────────────────────────────
// FILE: src/pages/Directory.tsx
// PURPOSE: Renders the team/staff directory, matching coming soon & visibility rules with staff overrides.
// ─────────────────────────────────────────────

import React, { useState } from "react";
import Layout from "../components/Layout";
import { useAppContext } from "../context/AppContext";
import { DirectoryCard } from "../components/DirectoryCard";
import { getLabel } from "../utils/labels";
import { getPageAccess } from "../utils/pageAccess";

export default function Directory() {
  const { users, appConfig, currentUser } = useAppContext();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "doctor" | "staff">("all");

  const pageTitle = getLabel(appConfig, "directory");

  const access = getPageAccess("directory", currentUser?.role, appConfig);

  // Hidden Check
  if (access === "hidden") {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 font-sans">
          <p className="text-gray-400 text-sm">This page is not available.</p>
        </div>
      </Layout>
    );
  }

  // Coming Soon Check
  if (access === "coming-soon") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center text-center px-6 py-20 font-sans">
          <span className="text-5xl mb-4">🔒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-500 mb-6 font-medium text-sm">
            This feature is currently under development and will be available soon.
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
    );

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
