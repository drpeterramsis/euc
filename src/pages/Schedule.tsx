// ─────────────────────────────────────────────
// FILE: src/pages/Schedule.tsx
// PURPOSE: Renders the general trip agenda (daily sessions/itinerary) for all users, loading from tripSchedule.json.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { readJSON } from "../utils/github";
import { getPageAccess } from "../utils/pageAccess";
import { useAppContext } from "../context/AppContext";
import { getLabel } from "../utils/labels";
import { utcToDisplay, localToUtc } from "../utils/timezone";
import DualClock from "../components/DualClock";

// Event type color map
const typeColorMap: Record<string, string> = {
  travel: "bg-yellow-100 text-yellow-800 border-yellow-300",
  hotel: "bg-blue-100   text-blue-800   border-blue-300",
  session: "bg-purple-100 text-purple-800 border-purple-300",
  activity: "bg-green-100  text-green-800  border-green-300",
  break: "bg-gray-100   text-gray-600   border-gray-300",
};

const typeDotMap: Record<string, string> = {
  travel: "bg-yellow-400",
  hotel: "bg-blue-500",
  session: "bg-purple-500",
  activity: "bg-green-500",
  break: "bg-gray-400",
};

export default function Schedule() {
  const { appConfig, currentUser } = useAppContext();
  const pageTitle = getLabel(appConfig, "schedule") || "Schedule";
  const access = getPageAccess("schedule", currentUser?.role, appConfig);

  const [tripDays, setTripDays] = useState<any[]>([]);

  useEffect(() => {
    readJSON("tripSchedule.json")
      .then(setTripDays)
      .catch(() => setTripDays([]));
  }, []);

  if (access === "hidden") {
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

  if (access === "coming-soon") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center text-center px-6 py-20 min-h-[60vh] font-sans">
          <span className="text-6xl mb-5">{"\uD83D\uDD12"}</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-500 mb-6 font-semibold text-sm max-w-xs">
            This feature is coming soon.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-2 max-w-2xl mx-auto">
        <div className="mb-4">
          <DualClock />
        </div>

        {/* Page Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              {"\uD83D\uDDD3\uFE0F"} {pageTitle}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Prague · June 25–28, 2026
            </p>
          </div>
          <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded">
            PRAGUE-2026
          </div>
        </div>

        {/* Day Cards */}
        <div className="flex flex-col gap-6">
          {tripDays.map((day) => (
            <div
              key={day.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Day Header */}
              <div className="bg-black px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">
                    {day.day}
                  </span>
                  <h2 className="text-white font-bold text-base">
                    {day.title}
                  </h2>
                </div>
                <span className="text-gray-400 text-xs font-semibold">
                  {day.date && !isNaN(new Date(day.date).getTime())
                    ? new Date(day.date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </span>
              </div>

              {/* Events Itinerary */}
              <div className="px-5 py-3 divide-y divide-gray-50">
                {day.events &&
                  day.events.map((event: any, idx: number) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 py-3 first:pt-2 last:pb-2"
                    >
                      {/* Time Column */}
                      <div className="flex flex-col w-20 flex-shrink-0 pt-0.5 items-end px-2">
                        {(() => {
                          const rawDate =
                            event.datetime_utc ||
                            localToUtc(
                              `${day.date}T${event.time || "00:00"}`,
                              "Africa/Cairo",
                            );
                          const cairo = utcToDisplay(rawDate, "Africa/Cairo");
                          const prague = utcToDisplay(rawDate, "Europe/Prague");
                          const showPrague = (event.timezoneDisplay ?? "both") === "both" || (event.timezoneDisplay ?? "both") === "prague";
                          const showCairo = (event.timezoneDisplay ?? "both") === "both" || (event.timezoneDisplay ?? "both") === "cairo";
                          return (
                            <>
                              {showPrague && (
                                <span className="text-xs font-bold text-gray-800">
                                  🇨🇿 {prague.time}
                                </span>
                              )}
                              {showCairo && (
                                <span className="text-[10px] text-gray-400 font-semibold mt-0.5 animate-fade-in">
                                  🇪🇬 {cairo.time}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Timeline Line with Dot */}
                      <div className="flex flex-col items-center pt-1.5 relative self-stretch">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${typeDotMap[event.type] ?? "bg-gray-400"}`}
                        />
                        {idx < day.events.length - 1 && (
                          <div className="w-px flex-1 bg-gray-100 my-1 min-h-[22px]" />
                        )}
                      </div>

                      {/* Event Content & Type Badge */}
                      <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {event.icon && (
                            <span className="text-lg flex-shrink-0">
                              {event.icon}
                            </span>
                          )}
                          <span className="text-sm font-bold text-gray-800 break-words leading-tight">
                            {event.label}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider flex-shrink-0
                        ${typeColorMap[event.type] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}
                        >
                          {event.type}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {tripDays.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-4xl mb-3">{"\uD83D\uDCED"}</p>
              <p className="text-sm font-bold text-gray-400">
                No schedule yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
