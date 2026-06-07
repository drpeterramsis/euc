// ─────────────────────────────────────────────
// FILE: src/pages/Sessions.tsx
// PURPOSE: Renders the list of scientific sessions, with staff visibility and coming soon bypasses.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect } from "react";
import Layout from "../components/Layout";
import { useApp } from "../context/AppContext";
import { getLabel } from "../utils/labels";
import { getPageAccess } from "../utils/pageAccess";
import { utcToDisplay, localToUtc, splitAmPm } from "../utils/timezone";

import { getPageAccess as getCentralPageAccess } from "../lib/pageAccess";

/**
 * Sessions component renders the list/grid of scientific sessions.
 */
export default function Sessions() {
  const { sessions, currentUser, appConfig, content } = useApp() as any;

  const pageTitle = getLabel(appConfig, "sessions");

  const centralAccess = content?.settings 
    ? getCentralPageAccess(content.settings, currentUser?.id || "", "agenda", currentUser?.role)
    : { enabled: true, comingSoon: false };

  // ✅ ONLY use getPageAccess — NEVER check appConfig.pages directly
  const access = getPageAccess("sessions", currentUser?.role, appConfig);

  // DEBUG — retrieve info during testing
  useEffect(() => {
    console.log("[Sessions] role:", currentUser?.role, "| access:", access);
  }, [currentUser?.role, access]);

  // Hidden Check
  if (access === "hidden" || !centralAccess.enabled) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] font-sans">
          <p className="text-gray-400 text-sm font-bold">
            This page is not available.
          </p>
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
            {appConfig?.navLabels?.["sessions"] ?? pageTitle}
          </h1>
          <p className="text-gray-500 mb-6 font-semibold text-sm max-w-xs">
            This feature is coming soon.
          </p>
        </div>
      </Layout>
    );
  }

  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;

  const sortedSessions = [...sessions].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.time || "").localeCompare(b.time || "");
  });

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <span className="text-sm bg-yellow-105 text-yellow-800 px-3 py-1 rounded-full font-bold border border-yellow-250">
          {sessions.length} sessions
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedSessions.length > 0 ? (
          sortedSessions.map((s: any) => (
            <div
              key={s.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col"
            >
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-105 mb-2 inline-block">
                  Session
                </span>
                <h3 className="font-bold text-xl text-gray-900 leading-tight mb-1">
                  {s.title}
                </h3>
                <p className="text-sm text-blue-600 font-bold uppercase">
                  🗣 {s.speaker}
                </p>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                <div className="flex flex-col text-sm text-gray-650">
                  {(() => {
                    const rawDate =
                      s.datetime_utc ||
                      localToUtc(
                        `${s.date}T${s.time || "00:00"}`,
                        "Africa/Cairo",
                      );
                    const cairo = utcToDisplay(rawDate, "Africa/Cairo");
                    const prague = utcToDisplay(rawDate, "Europe/Prague");
                    const showPrague = (s.timezoneDisplay ?? "both") === "both" || (s.timezoneDisplay ?? "both") === "prague";
                    const showCairo = (s.timezoneDisplay ?? "both") === "both" || (s.timezoneDisplay ?? "both") === "cairo";
                    return (
                      <div className="flex flex-col gap-1.5 items-start">
                        {showPrague && (() => {
                          const { digits, period } = splitAmPm(prague.time);
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 border border-amber-300 text-amber-900 font-bold whitespace-nowrap">
                              🇨🇿 {digits}<span className="text-[10px] font-semibold text-amber-500 ml-0.5">{period}</span> {s.toTime ? `(Prague)` : ""}
                            </span>
                          );
                        })()}
                        {showCairo && (() => {
                          const { digits, period } = splitAmPm(cairo.time);
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 border border-blue-200 text-blue-800 font-bold whitespace-nowrap">
                              🇪🇬 {digits}<span className="text-[10px] font-semibold text-amber-500 ml-0.5">{period}</span> {s.toTime ? `(Cairo)` : ""}
                            </span>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-650">
                  <span className="font-bold">📅 {s.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-650">
                  <span className="font-bold">🏛 Hall: {s.hall}</span>
                </div>
              </div>

              {s.link && (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-black text-white text-center py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                >
                  Join / Open Link
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
            <span className="text-4xl mb-4 block">🎓</span>
            <p className="text-gray-500 font-bold">
              No scientific sessions scheduled yet.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
