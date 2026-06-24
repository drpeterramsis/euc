// ─────────────────────────────────────────────
// FILE: src/components/SmartCountdown.tsx
// PURPOSE: Renders a smart countdown widget that counts down to the next upcoming trip event, supporting admin custom overrides and timeline display.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from "react";
import {
  buildTimeline,
  getNextEvent,
  formatRelativeTime,
  TimelineEvent,
} from "../utils/countdownUtils";
import { utcToDisplay, splitAmPm } from "../utils/timezone";

interface SmartCountdownProps {
  scheduleItems: any[];
  countdownConfig: {
    customMessage: string;
    showTimeline: boolean;
    customTimelineEntries: any[];
  };
}

export default function SmartCountdown({
  scheduleItems,
  countdownConfig,
}: SmartCountdownProps) {
  const [now, setNow] = useState(Date.now());
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [nextEvent, setNext] = useState<TimelineEvent | null>(null);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  // Tick every second to ensure live precision countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Rebuild timeline when data or time changes
  useEffect(() => {
    const tl = buildTimeline(
      scheduleItems,
      countdownConfig?.customTimelineEntries ?? [],
    );
    setTimeline(tl);
    setNext(getNextEvent(tl));
  }, [scheduleItems, countdownConfig, now]);

  // ── Countdown math ──────────────────────────────────────
  const diff = nextEvent
    ? Math.max(0, new Date(nextEvent.datetime).getTime() - now)
    : 0;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  const showDays = days > 0;

  // ── Color map for badges ──────────────────────────────
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-100 border border-yellow-300 text-yellow-800",
    green: "bg-green-100 border border-green-300 text-green-800",
    blue: "bg-blue-100 border border-blue-300 text-blue-800",
    red: "bg-red-100 border border-red-300 text-red-800",
    gray: "bg-gray-100 border border-gray-300 text-gray-650",
  };

  const dotMap: Record<string, string> = {
    yellow: "bg-amber-400",
    green: "bg-green-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
    gray: "bg-gray-300",
  };

  // Helper to format remaining time beautifully for the collapsed title
  const getCollapsedTimeText = () => {
    if (days > 0) {
      return `${days}d ${hours}h left`;
    }
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-5 overflow-hidden transition-all duration-300">
      {/* ── COUNTDOWN DIGITS (Dark Timer Island) ─────────────────────────── */}
      {nextEvent && (
        <div className="bg-gray-900 rounded-xl px-4 py-3.5 mb-3">
          <div className="flex items-end justify-center gap-1.5 sm:gap-2">

            {/* Days — only when > 0 */}
            {showDays && (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-bold text-yellow-400 tabular-nums leading-none">
                    {String(days).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-yellow-300 mt-1">
                    days
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-yellow-300 opacity-70 mx-0.5 pb-2">
                  :
                </span>
              </>
            )}

            {/* Hours */}
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-bold text-yellow-400 tabular-nums leading-none">
                {String(hours).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase tracking-widest font-semibold text-yellow-300 mt-1">
                hrs
              </span>
            </div>

            <span className="text-2xl sm:text-3xl font-bold text-yellow-300 opacity-70 mx-0.5 pb-2">
              :
            </span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-bold text-yellow-400 tabular-nums leading-none">
                {String(mins).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase tracking-widest font-semibold text-yellow-300 mt-1">
                min
              </span>
            </div>

            <span className="text-xl font-normal text-white opacity-50 mx-0.5 pb-2">
              :
            </span>

            {/* Seconds ── */}
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-normal text-white opacity-80 tabular-nums leading-none">
                {String(secs).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase tracking-widest font-normal text-white opacity-40 mt-1">
                sec
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ── HIGHLIGHTED NEXT EVENT ─────────────────────────────── */}
      {nextEvent && (
        <div className="bg-amber-50/40 border border-amber-150 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-inner shadow-amber-50/5 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl animate-pulse shrink-0">{nextEvent.icon}</span>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200 inline-block mb-1">
                FIRST UPCOMING EVENT
              </span>
              <h4 className="text-sm font-extrabold text-gray-900 truncate">
                {nextEvent.label}
              </h4>
            </div>
          </div>
          {countdownConfig?.showTimeline && timeline.length > 0 && (
            <button
              onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
              className="text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-3.5 py-2 rounded-lg border border-amber-200 transition-colors uppercase tracking-widest cursor-pointer text-center shrink-0"
            >
              {isTimelineExpanded ? "Hide Timeline" : "Show Timeline"}
            </button>
          )}
        </div>
      )}

      {/* Standalone Trigger Button (only if showTimeline is enabled but no nextEvent is found) */}
      {!nextEvent && countdownConfig?.showTimeline && timeline.length > 0 && (
        <button
          onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          className="w-full text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-4 py-3 rounded-lg border border-amber-200 transition-colors uppercase tracking-widest cursor-pointer text-center block mb-1"
        >
          {isTimelineExpanded ? "Hide Timeline" : "Show Timeline"}
        </button>
      )}

      {/* ── TIMELINE (COLLAPSIBLE / COLLAPSED BY DEFAULT) ─────────────────── */}
      {countdownConfig?.showTimeline && timeline.length > 0 && isTimelineExpanded && (
        <div className="mt-4 bg-white rounded-xl overflow-hidden border border-yellow-100 shadow-xs">
          <p className="text-yellow-850/70 text-[9px] uppercase tracking-widest px-4 pt-3 pb-2 border-b border-yellow-50 font-black font-sans">
            Trip Timeline
          </p>

          <div className="divide-y divide-yellow-50/60 max-h-[300px] overflow-y-auto">
            {timeline.map((event, idx) => {
              const isNext = nextEvent?.id === event.id;
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 px-3.5 py-2.5
                    ${event.isPast ? "opacity-45" : ""}
                    ${isNext ? "bg-amber-50/30" : ""}
                  `}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center self-stretch pt-1.5 font-sans">
                    {isNext ? (
                      <span className="relative flex items-center justify-center w-3.5 h-3.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-90" />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotMap[event.color]}`} />
                      </span>
                    ) : (
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${dotMap[event.color]}`}
                      />
                    )}
                    {idx < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-yellow-100 mt-1" />
                    )}
                  </div>

                  {/* Event info */}
                  <div className="flex-1 min-w-0 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs shrink-0">{event.icon}</span>
                      <span
                        className={`text-xs font-bold truncate
                        ${event.isPast ? "text-gray-400 font-normal" : "text-gray-900"}`}
                      >
                        {event.label}
                      </span>
                      {isNext && (
                        <span className="text-[8px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-black flex-shrink-0">
                          NEXT
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] mt-0.5 font-sans">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        {((event.timezoneDisplay ?? "both") === "both" || (event.timezoneDisplay ?? "both") === "prague") && (() => {
                          const pragueDisp = utcToDisplay(event.datetime, "Europe/Prague");
                          const { digits, period } = splitAmPm(pragueDisp.time);
                          return (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] bg-amber-50 border border-amber-200 text-amber-900">
                                🇨🇿&nbsp;
                                <span className="font-bold">{digits}</span>
                                <span className="text-[9px] font-semibold text-amber-500 ml-0.5">
                                  {period}
                                </span>
                              </span>
                              <span className="text-gray-400 text-[9px]">{pragueDisp.date}</span>
                            </span>
                          );
                        })()}
                        
                        {(event.timezoneDisplay ?? "both") === "both" && (
                          <span className="text-gray-300 text-[10px] mx-0.5">|</span>
                        )}

                        {((event.timezoneDisplay ?? "both") === "both" || (event.timezoneDisplay ?? "both") === "cairo") && (() => {
                          const cairoDisp = utcToDisplay(event.datetime, "Africa/Cairo");
                          const { digits, period } = splitAmPm(cairoDisp.time);
                          return (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] bg-blue-50/50 border border-blue-200 text-blue-800">
                                🇪🇬&nbsp;
                                <span className="font-bold">{digits}</span>
                                <span className="text-[9px] font-semibold text-amber-500 ml-0.5">
                                  {period}
                                </span>
                              </span>
                              <span className="text-gray-400 text-[9px]">{cairoDisp.date}</span>
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Relative time badge */}
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-md flex-shrink-0 font-sans uppercase tracking-wider border
                    ${
                      event.isPast
                        ? "bg-gray-50 text-gray-400 border-gray-150"
                        : event.isSoon
                          ? "bg-red-500 text-white border-red-400 animate-pulse"
                          : colorMap[event.color]
                    }`}
                  >
                    {formatRelativeTime(event.diff)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
