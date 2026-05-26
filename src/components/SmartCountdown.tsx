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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 px-4 py-4">
      {/* ── COUNTDOWN HEADER ─────────────────────────────── */}
      <div className="text-center font-sans">
        {/* Next event label — Event title */}
        {nextEvent ? (
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">{nextEvent.icon}</span>
            <span className="text-gray-900 font-bold text-lg">
              {nextEvent.label}
            </span>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-1 font-sans">
            No upcoming events
          </p>
        )}

        {/* Custom admin message — Event subtitle / description */}
        {countdownConfig?.customMessage ? (
          <p className="text-gray-500 text-sm mt-1 mb-3 font-sans text-center">
            "{countdownConfig.customMessage}"
          </p>
        ) : (
          <p className="text-gray-500 text-sm mt-1 mb-3 font-sans text-center">
            Upcoming Scientific Meeting & Tour Details
          </p>
        )}

        {/* ── COUNTDOWN DIGITS (Dark Timer Island) ─────────────────────────── */}
        {nextEvent && (
          <div className="bg-gray-900 rounded-xl px-4 py-3 mt-4">
            <div className="flex items-end justify-center gap-1 sm:gap-2">

              {/* Days — only when > 0 */}
              {showDays && (
                <>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl sm:text-5xl font-bold text-yellow-400 tabular-nums leading-none">
                      {String(days).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-yellow-300 mt-1">
                      days
                    </span>
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold text-yellow-300 opacity-70 mx-1 pb-4">
                    :
                  </span>
                </>
              )}

              {/* Hours */}
              <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-5xl font-bold text-yellow-400 tabular-nums leading-none">
                  {String(hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-yellow-300 mt-1">
                  hrs
                </span>
              </div>

              <span className="text-3xl sm:text-4xl font-bold text-yellow-300 opacity-70 mx-1 pb-4">
                :
              </span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-5xl font-bold text-yellow-400 tabular-nums leading-none">
                  {String(mins).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-yellow-300 mt-1">
                  min
                </span>
              </div>

              <span className="text-xl font-normal text-white opacity-50 mx-1 pb-4">
                :
              </span>

              {/* Seconds — de-emphasized */}
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-normal text-white opacity-80 tabular-nums leading-none">
                  {String(secs).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-normal text-white opacity-40 mt-1">
                  sec
                </span>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── TIMELINE ─────────────────────────────────────── */}
      {countdownConfig?.showTimeline && timeline.length > 0 && (
        <div className="mt-5 bg-white rounded-xl overflow-hidden border border-yellow-100 shadow-sm">
          <p className="text-yellow-850/70 text-[10px] uppercase tracking-widest px-4 pt-3.5 pb-2 border-b border-yellow-100 font-extrabold font-sans">
            Trip Timeline
          </p>

          <div className="divide-y divide-yellow-100">
            {timeline.map((event, idx) => {
              const isNext = nextEvent?.id === event.id;
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 px-4 py-2.5
                    ${event.isPast ? "opacity-40" : ""}
                    ${isNext ? "bg-yellow-50/50" : ""}
                  `}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center self-stretch pt-1.5 font-sans">
                    {isNext ? (
                      <span className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
                        {/* COMMENT: Outer ping ring — green for perfect contrast on yellow-50 page background */}
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-90" />
                        {/* COMMENT: Inner solid dot — keeps its original event type color class */}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${dotMap[event.color]}`} />
                      </span>
                    ) : (
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotMap[event.color]}`}
                      />
                    )}
                    {idx < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-yellow-200 mt-1" />
                    )}
                  </div>

                  {/* Event info */}
                  <div className="flex-1 min-w-0 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{event.icon}</span>
                      <span
                        className={`text-sm font-bold truncate
                        ${event.isPast ? "text-gray-400 font-normal" : "text-gray-900"}`}
                      >
                        {event.label}
                      </span>
                      {isNext && (
                        <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-black flex-shrink-0">
                          NEXT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] mt-0.5 font-sans">
                      <span className="flex items-center gap-2 flex-wrap">
                        {((event.timezoneDisplay ?? "both") === "both" || (event.timezoneDisplay ?? "both") === "prague") && (() => {
                          const pragueDisp = utcToDisplay(event.datetime, "Europe/Prague");
                          const { digits, period } = splitAmPm(pragueDisp.time);
                          return (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm bg-amber-100 border border-amber-300 text-amber-900">
                                🇨🇿&nbsp;
                                <span className="font-bold">{digits}</span>
                                <span className="text-[10px] font-semibold text-amber-500 ml-0.5">
                                  {period}
                                </span>
                              </span>
                              <span className="text-gray-400 text-xs">{pragueDisp.date}</span>
                            </span>
                          );
                        })()}
                        
                        {(event.timezoneDisplay ?? "both") === "both" && (
                          <span className="text-gray-300 text-xs mx-1">|</span>
                        )}

                        {((event.timezoneDisplay ?? "both") === "both" || (event.timezoneDisplay ?? "both") === "cairo") && (() => {
                          const cairoDisp = utcToDisplay(event.datetime, "Africa/Cairo");
                          const { digits, period } = splitAmPm(cairoDisp.time);
                          return (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm bg-blue-50 border border-blue-200 text-blue-800">
                                🇪🇬&nbsp;
                                <span className="font-bold">{digits}</span>
                                <span className="text-[10px] font-semibold text-amber-500 ml-0.5">
                                  {period}
                                </span>
                              </span>
                              <span className="text-gray-400 text-xs">{cairoDisp.date}</span>
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Relative time badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 font-sans uppercase tracking-wider
                    ${
                      event.isPast
                        ? "bg-gray-100 text-gray-400 border border-gray-200"
                        : event.isSoon
                          ? "bg-red-500 text-white animate-pulse"
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
