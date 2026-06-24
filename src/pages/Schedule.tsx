// ─────────────────────────────────────────────
// FILE: src/pages/Schedule.tsx
// PURPOSE: Renders the general trip agenda (daily sessions/itinerary) for all users, loading from tripSchedule.json.
// Added live event tracking, countdowns, auto past fading, quick anchors, and responsive columns.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import { readJSON } from "../utils/github";
import { getPageAccess } from "../utils/pageAccess";
import { getPageAccess as getCentralPageAccess } from "../lib/pageAccess";
import ComingSoon from "../components/ComingSoon";
import { useAppContext } from "../context/AppContext";
import { getLabel } from "../utils/labels";
import { utcToDisplay, localToUtc, splitAmPm } from "../utils/timezone";
import DualClock from "../components/DualClock";
import { MapPhoto } from "../components/MapPhoto";

// Event type color map
const typeColorMap: Record<string, string> = {
  travel: "bg-amber-50 text-amber-800 border-amber-200",
  hotel: "bg-blue-50   text-blue-850   border-blue-200",
  session: "bg-purple-50 text-purple-850 border-purple-200",
  activity: "bg-green-50  text-green-850  border-green-200",
  break: "bg-gray-50   text-gray-700   border-gray-200",
};

const typeDotMap: Record<string, string> = {
  travel: "bg-amber-400",
  hotel: "bg-blue-500",
  session: "bg-purple-500",
  activity: "bg-green-500",
  break: "bg-gray-400",
};

export default function Schedule() {
  const { appConfig, currentUser, content } = useAppContext() as any;
  const pageTitle = getLabel(appConfig, "schedule") || "Schedule";
  const access = getPageAccess("schedule", currentUser?.role, appConfig);

  const centralAccess = content?.settings 
    ? getCentralPageAccess(currentUser?.id || "", currentUser?.role || "", "agenda", content.settings)
    : { enabled: true, comingSoon: false };

  // Track current timestamp to enable real-time countdowns & past/present/future states
  const [now, setNow] = useState<Date>(new Date());
  const [tripDays, setTripDays] = useState<any[]>([]);

  useEffect(() => {
    // Keep internal clock running
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    readJSON("tripSchedule.json")
      .then(setTripDays)
      .catch(() => setTripDays([]));
  }, []);

  if (!centralAccess.enabled) {
    return <Navigate to="/access-denied" replace />;
  }

  if (centralAccess.comingSoon) {
    return (
      <Layout>
        <ComingSoon />
      </Layout>
    );
  }

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
          <span className="text-6xl mb-5">{"🔒"}</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-500 mb-6 font-semibold text-sm max-w-xs">
            This feature is coming soon.
          </p>
        </div>
      </Layout>
    );
  }

  // Helper utility to resolve an exact UTC Date object for an event
  const getEventDateUtc = (dayDate: string, event: any) => {
    const timeStr = event.time || "12:00";
    const timezone = event.inputTimezone || "Europe/Prague";
    try {
      const isostring = `${dayDate}T${timeStr}`;
      const utcStr = localToUtc(isostring, timezone);
      return new Date(utcStr);
    } catch {
      return new Date(`${dayDate}T${timeStr}`);
    }
  };

  // Flat list of all events with computed UTC timestamps for linear timeline assessment
  const allEventsWithDates = tripDays
    .flatMap((day) =>
      (day.events || []).map((evt: any) => {
        const utcDate = getEventDateUtc(day.date, evt);
        return {
          ...evt,
          dayId: day.id,
          dayDate: day.date,
          utcDate,
        };
      })
    )
    .sort((a, b) => a.utcDate.getTime() - b.utcDate.getTime());

  // Find "Next Event" (first future event)
  const nextEvent = allEventsWithDates.find((e) => e.utcDate.getTime() > now.getTime());

  // Find "Happening Now" (the latest past event starting <= now, within a 3 hour activity window)
  let activeEvent: any = null;
  const pastEvents = allEventsWithDates.filter((e) => e.utcDate.getTime() <= now.getTime());
  if (pastEvents.length > 0) {
    const latestPast = pastEvents[pastEvents.length - 1];
    const millisecondsElapsed = now.getTime() - latestPast.utcDate.getTime();
    const hoursElapsed = millisecondsElapsed / (1000 * 60 * 60);
    // Mark as happening now if event started in the last 3 hours
    if (hoursElapsed < 3) {
      activeEvent = latestPast;
    }
  }

  // Determine jump target (happening now prioritized, fallbacks to next event)
  const jumpTarget = activeEvent || nextEvent;

  // Jump smooth scrolling navigation handler
  const handleJumpToCurrent = () => {
    if (jumpTarget) {
      const targetId = `event-row-${jumpTarget.id}`;
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight active jump
        element.classList.add("ring-2", "ring-amber-400", "scale-[1.01]", "bg-amber-50/20");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-amber-400", "scale-[1.01]", "bg-amber-50/20");
        }, 2000);
      } else {
        // Fallback to day card anchor
        const dayElement = document.getElementById(`day-card-${jumpTarget.dayId}`);
        if (dayElement) {
          dayElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  // Next event live ticking countdown values computed dynamically from the existing ticking 'now' state
  let timeLeft = null;
  if (nextEvent) {
    const diff = nextEvent.utcDate.getTime() - now.getTime();
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 65); // Standardize dynamic time bounding
      timeLeft = {
        days,
        hours: hours % 24,
        minutes: minutes % 60,
        seconds: seconds % 60
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
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
              {"📅"} {pageTitle}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Prague · June 25–28, 2026
            </p>
          </div>
          <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded">
            PRAGUE-2026
          </div>
        </div>

        {/* live Event Countdown section */}
        {nextEvent && timeLeft && (
          <div className="w-full rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8 mb-8 text-center font-sans">
            {/* Countdown Header */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {nextEvent.icon && <span className="text-2xl select-none">{nextEvent.icon}</span>}
              <span className="text-gray-900 font-extrabold text-lg">
                {nextEvent.label}
              </span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-5">
              Upcoming Scientific Meeting & Tour Details
            </p>

            {/* Countdown digits container (matching the home page dark island style) */}
            <div className="bg-gray-900 rounded-2xl p-5 sm:p-6 w-full max-w-lg mx-auto">
              <div className="flex items-end justify-center gap-1.5 sm:gap-3">

                {/* Days */}
                {timeLeft.days > 0 && (
                  <>
                    <div className="flex flex-col items-center">
                      <span className="text-4xl sm:text-5xl font-black text-amber-400 tabular-nums leading-none">
                        {String(timeLeft.days).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-300 mt-1.5">
                        days
                      </span>
                    </div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 opacity-70 mx-1 pb-4 select-none">
                      :
                    </span>
                  </>
                )}

                {/* Hours */}
                <div className="flex flex-col items-center">
                  <span className="text-4xl sm:text-5xl font-black text-amber-400 tabular-nums leading-none">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-300 mt-1.5">
                    hrs
                  </span>
                </div>

                <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 opacity-70 mx-1 pb-4 select-none">
                  :
                </span>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <span className="text-4xl sm:text-5xl font-black text-amber-400 tabular-nums leading-none">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-300 mt-1.5">
                    min
                  </span>
                </div>

                <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 opacity-70 mx-1 pb-4 select-none">
                  :
                </span>

                {/* Seconds */}
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-normal text-white opacity-80 tabular-nums leading-none">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-normal text-white opacity-45 mt-1.5">
                    sec
                  </span>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Jumper Quick Anchor button to "Happening Now" / "Up Next" */}
        {jumpTarget && (
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-amber-50/30 border border-amber-100 p-4 sm:p-3.5 rounded-xl shadow-sm gap-4 sm:gap-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              {activeEvent ? (
                <>
                  <span className="relative flex h-3 w-3 flex-shrink-0 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Happening Now
                    </span>
                    <p className="text-xs font-bold text-gray-800 mt-1 flex items-start gap-1 whitespace-normal break-words">
                      {activeEvent.icon && <span className="select-none text-sm mt-0.5 shrink-0">{activeEvent.icon}</span>}
                      {/* COMMENT: Allow Up Next title to wrap up to 2 lines max, clip overflow gracefully if any, but do not show ellipsis "..." */}
                      <span className="whitespace-normal break-words leading-snug flex-1 max-h-[2.4rem] overflow-hidden text-ellipsis-none" style={{ textOverflow: 'clip' }}>
                        {activeEvent.label}
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0 mt-1">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Up Next
                    </span>
                    <p className="text-xs font-bold text-gray-800 mt-1 flex items-start gap-1 whitespace-normal break-words">
                      {nextEvent.icon && <span className="select-none text-sm mt-0.5 shrink-0">{nextEvent.icon}</span>}
                      {/* COMMENT: Allow Up Next title to wrap up to 2 lines max, clip overflow gracefully if any, but do not show ellipsis "..." */}
                      <span className="whitespace-normal break-words leading-snug flex-1 max-h-[2.4rem] overflow-hidden text-ellipsis-none" style={{ textOverflow: 'clip' }}>
                        {nextEvent.label}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleJumpToCurrent}
              type="button"
              className="flex-shrink-0 cursor-pointer bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-black px-4 py-2.5 sm:px-3.5 sm:py-2 rounded-lg font-black text-[10px] flex items-center justify-center gap-1 uppercase tracking-wider transition-all shadow-sm self-stretch sm:self-center whitespace-nowrap"
            >
              🚀 {activeEvent ? "GOTO NOW" : "CHECK WHAT'S NEXT"}
            </button>
          </div>
        )}

        {/* Day Cards */}
        <div className="flex flex-col gap-6">
          {tripDays.map((day) => (
            <div
              key={day.id}
              id={`day-card-${day.id}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-24"
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
              <div className="px-5 py-3 divide-y divide-gray-100">
                {day.events &&
                  day.events.map((event: any, idx: number) => {
                    const evtUtc = getEventDateUtc(day.date, event);
                    const isPast = evtUtc.getTime() < now.getTime() && activeEvent?.id !== event.id;
                    const isNow = activeEvent?.id === event.id;
                    const isImportant = event.important || 
                      event.type === "session" || 
                      (event.label && (
                        event.label.toLowerCase().includes("flight") ||
                        event.label.toLowerCase().includes("check-out") ||
                        event.label.toLowerCase().includes("checkout") ||
                        event.label.toLowerCase().includes("depart") ||
                        event.label.toLowerCase().includes("arrive") ||
                        event.label.toLowerCase().includes("scientific")
                      ));

                    return (
                      <div
                        key={event.id}
                        id={`event-row-${event.id}`}
                        className={`flex flex-col md:flex-row md:items-start gap-3 md:gap-4 py-4 px-3 first:pt-2 last:pb-2 transition-all duration-300 scroll-mt-28 rounded-xl
                          ${isPast ? "opacity-55 scale-[0.98] grayscale-[15%]" : ""} 
                          ${isNow ? "bg-amber-50/20 border border-amber-200" : ""}
                          ${isImportant && !isNow && !isPast ? "bg-red-50/40 border-l-4 border-l-red-500 border-y border-r border-red-100/40 shadow-xs" : ""}`}
                      >
                        {/* Time Column/Row (Sits ABOVE details on mobile, and to the left on desktop) */}
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-1.5 md:gap-1.5 md:w-20 md:flex-shrink-0 flex-wrap">
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
                                {showPrague && (() => {
                                  const { digits, period } = splitAmPm(prague.time);
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 border border-amber-250 text-amber-950 font-black whitespace-nowrap">
                                      🇨🇿 {digits}<span className="text-[8px] font-bold text-amber-600 ml-0.5">{period}</span>
                                    </span>
                                  );
                                })()}
                                {showCairo && (() => {
                                  const { digits, period } = splitAmPm(cairo.time);
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-50 border border-blue-250 text-blue-900 font-black whitespace-nowrap">
                                      🇪🇬 {digits}<span className="text-[8px] font-bold text-blue-600 ml-0.5">{period}</span>
                                    </span>
                                  );
                                })()}
                              </>
                            );
                          })()}
                        </div>

                        {/* Interactive Timeline line with Pulsator (Vertical alignment only on Desktop) */}
                        <div className="hidden md:flex flex-col items-center pt-1.5 relative self-stretch select-none">
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative transition-transform ${
                              isNow
                                ? "bg-emerald-500 scale-125 ring-4 ring-emerald-100"
                                : isPast
                                ? "bg-gray-300"
                                : typeDotMap[event.type] ?? "bg-gray-400"
                            }`}
                          >
                            {isNow && (
                              <span className="animate-ping absolute top-0 left-0 inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            )}
                          </div>
                          {idx < day.events.length - 1 && (
                            <div className="w-px flex-1 bg-gray-100 my-1.5 min-h-[22px]" />
                          )}
                        </div>

                        {/* Event Content & Type Badge (Full-width custom layouts with short maps links) */}
                        <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-start gap-2.5">
                              {event.icon && (
                                <span className="text-xl flex-shrink-0 mt-0.5 select-none">
                                  {event.icon}
                                </span>
                              )}
                              <div className="min-w-0">
                                <span className={`text-sm font-bold text-gray-800 break-words leading-tight flex flex-wrap items-center gap-1.5 ${isNow ? 'text-emerald-800 font-black' : ''}`}>
                                  {event.label}
                                  {isNow && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] bg-emerald-100 text-emerald-800 font-black uppercase tracking-wider animate-pulse">
                                      • Happening Now
                                    </span>
                                  )}
                                  {isImportant && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] bg-red-100 border border-red-200 text-red-700 font-black uppercase tracking-wider select-none">
                                      🚩 Important Event
                                    </span>
                                  )}
                                </span>

                                {/* 📍 Custom Location Name with a Minified Short map directions button */}
                                {event.location && (
                                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 font-bold bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-md">
                                      📍 {event.location}
                                    </span>
                                    {event.mapLocation && (
                                      <a
                                        href={event.mapLocation}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        referrerPolicy="no-referrer"
                                        className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-150 px-2.5 py-0.5 rounded-md transition-all uppercase tracking-wider cursor-pointer"
                                        title="View location on the Map"
                                      >
                                        🗺️ Map Link
                                      </a>
                                    )}
                                  </div>
                                )}

                                {event.mapLocation && (
                                  <div className="mt-2.5 max-w-xs sm:max-w-sm rounded-lg overflow-hidden border border-gray-150 shadow-xs">
                                    <MapPhoto 
                                      url={event.mapLocation} 
                                      alt={event.location || event.label} 
                                      className="w-full h-24 object-cover animate-fadeIn"
                                    />
                                  </div>
                                )}

                                {day.date === "2026-06-26" && event.type === "break" && (
                                  <div className="mt-4 p-4 bg-gray-50/75 rounded-xl border border-gray-150 shadow-xs">
                                    <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-gray-200">
                                      <span className="text-base select-none">🗺️</span>
                                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                                        Recommended Free Time Destinations
                                      </h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {[
                                        {
                                          name: "Primark",
                                          category: "🛍️ Shopping",
                                          description: "A popular, massive multi-story department store in the heart of Prague, offering a huge selection of trendy fashion, homeware, and accessories at budget-friendly prices.",
                                          mapUrl: "https://maps.app.goo.gl/Le5KXX2zXXsPqWHB6",
                                        },
                                        {
                                          name: "Billa",
                                          category: "🛒 Supermarket",
                                          description: "A premium European supermarket chain store in Prague, perfect for picking up local chocolates, traditional snacks, fresh fruits, and refreshing drinks.",
                                          mapUrl: "https://maps.app.goo.gl/U7fVMCrUHx5zWtVu8",
                                        },
                                        {
                                          name: "Prague's Narrowest Alley",
                                          category: "📸 Sightseeing",
                                          description: "A unique 150-meter-long historic passage so narrow (only 50cm wide) that a pedestrian traffic light is installed to coordinate visitors walking through.",
                                          mapUrl: "https://maps.app.goo.gl/ykNhByd5uTRexiCj7",
                                        },
                                        {
                                          name: "Prague Castle",
                                          category: "🏰 Landmark",
                                          description: "One of the most magnificent and largest ancient castle complexes in the world, dominating the city skyline with breathtaking Gothic architecture and panoramic vistas.",
                                          mapUrl: "https://maps.app.goo.gl/dV29a8Dxd1VTHjuDA",
                                        }
                                      ].map((place) => (
                                        <div key={place.name} className="bg-white rounded-lg border border-gray-150 overflow-hidden flex flex-col justify-between shadow-xs">
                                          <div>
                                            <div className="w-full h-28 relative bg-gray-100 overflow-hidden">
                                              <MapPhoto 
                                                url={place.mapUrl} 
                                                alt={place.name} 
                                                className="w-full h-full object-cover"
                                              />
                                              <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-wider bg-black/75 text-yellow-400 px-2 py-0.5 rounded shadow select-none">
                                                {place.category}
                                              </span>
                                            </div>
                                            <div className="p-3">
                                              <h5 className="text-xs font-black text-gray-900 leading-tight">
                                                {place.name}
                                              </h5>
                                              <p className="text-[11px] leading-relaxed text-gray-500 mt-1 font-medium">
                                                {place.description}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="p-3 pt-0">
                                            <a
                                              href={place.mapUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              referrerPolicy="no-referrer"
                                              className="w-full cursor-pointer inline-flex items-center justify-center gap-1.5 text-[9px] font-black text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 rounded-md transition-all uppercase tracking-wider"
                                            >
                                              📍 View Directions
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Action button of operation defined by the admin */}
                                {event.link && (
                                  <div className="mt-2.5">
                                    <a
                                      href={event.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      referrerPolicy="no-referrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-all shadow-sm uppercase tracking-wider cursor-pointer"
                                    >
                                      🔗 {event.actionText || "View Activity Details"}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0 self-start mt-0.5
                          ${typeColorMap[event.type] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}
                          >
                            {event.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          {tripDays.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-4xl mb-3">{"📬"}</p>
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
