// ─────────────────────────────────────────────
// FILE: src/components/SmartCountdown.tsx
// PURPOSE: Renders a smart countdown widget that counts down to the next upcoming trip event, supporting admin custom overrides and timeline display.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from "react";
import { buildTimeline, getNextEvent, formatRelativeTime, TimelineEvent } from "../utils/countdownUtils";

interface SmartCountdownProps {
  scheduleItems: any[];
  countdownConfig: {
    customMessage:         string;
    showTimeline:          boolean;
    customTimelineEntries: any[];
  };
}

export default function SmartCountdown({
  scheduleItems,
  countdownConfig
}: SmartCountdownProps) {

  const [now, setNow]           = useState(Date.now());
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [nextEvent, setNext]    = useState<TimelineEvent | null>(null);

  // Tick every second to ensure live precision countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Rebuild timeline when data or time changes
  useEffect(() => {
    const tl = buildTimeline(
      scheduleItems,
      countdownConfig?.customTimelineEntries ?? []
    );
    setTimeline(tl);
    setNext(getNextEvent(tl));
  }, [scheduleItems, countdownConfig, now]);

  // ── Countdown math ──────────────────────────────────────
  const diff   = nextEvent ? Math.max(0, new Date(nextEvent.datetime).getTime() - now) : 0;
  const days   = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours  = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins   = Math.floor((diff / (1000 * 60)) % 60);
  const secs   = Math.floor((diff / 1000) % 60);

  const pad = (n: number) => String(n).padStart(2, "0");

  // ── Color map ───────────────────────────────────────────
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-400 text-black",
    green:  "bg-green-500  text-white",
    blue:   "bg-blue-500   text-white",
    red:    "bg-red-500    text-white",
    gray:   "bg-gray-400   text-white",
  };

  const dotMap: Record<string, string> = {
    yellow: "bg-yellow-400",
    green:  "bg-green-500",
    blue:   "bg-blue-500",
    red:    "bg-red-500",
    gray:   "bg-gray-300",
  };

  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-lg">

      {/* ── COUNTDOWN HEADER ─────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 text-center">

        {/* Next event label */}
        {nextEvent ? (
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">{nextEvent.icon}</span>
            <span className="text-white font-bold text-lg">
              {nextEvent.label}
            </span>
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-1 font-sans">No upcoming events</p>
        )}

        {/* Custom admin message */}
        {countdownConfig?.customMessage && (
          <p className="text-yellow-400 text-sm font-medium mt-1 mb-3 italic font-sans text-center">
            "{countdownConfig.customMessage}"
          </p>
        )}

        {/* ── COUNTDOWN DIGITS ─────────────────────────── */}
        {nextEvent && (
          <div className="flex items-end justify-center gap-2 mt-4">

            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="bg-white/10 rounded-xl px-4 py-3 min-w-[56px]">
                <span className="text-white text-3xl font-black tabular-nums tracking-tight">
                  {pad(days)}
                </span>
              </div>
              <span className="text-gray-400 text-[10px] uppercase tracking-widest mt-1.5 font-bold">
                Days
              </span>
            </div>

            <span className="text-white/40 text-2xl font-light mb-5 font-mono">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="bg-white/10 rounded-xl px-4 py-3 min-w-[56px]">
                <span className="text-white text-3xl font-black tabular-nums tracking-tight">
                  {pad(hours)}
                </span>
              </div>
              <span className="text-gray-400 text-[10px] uppercase tracking-widest mt-1.5 font-bold">
                Hours
              </span>
            </div>

            <span className="text-white/40 text-2xl font-light mb-5 font-mono">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="bg-white/10 rounded-xl px-4 py-3 min-w-[56px]">
                <span className="text-white text-3xl font-black tabular-nums tracking-tight">
                  {pad(mins)}
                </span>
              </div>
              <span className="text-gray-400 text-[10px] uppercase tracking-widest mt-1.5 font-bold">
                Mins
              </span>
            </div>

            <span className="text-white/40 text-2xl font-light mb-5 font-mono">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="bg-yellow-400 rounded-xl px-4 py-3 min-w-[56px]">
                <span className="text-black text-3xl font-black tabular-nums tracking-tight">
                  {pad(secs)}
                </span>
              </div>
              <span className="text-gray-400 text-[10px] uppercase tracking-widest mt-1.5 font-bold">
                Secs
              </span>
            </div>

          </div>
        )}
      </div>

      {/* ── TIMELINE ─────────────────────────────────────── */}
      {countdownConfig?.showTimeline && timeline.length > 0 && (
        <div className="mx-4 mb-5 mt-2 bg-white/5 rounded-xl overflow-hidden border border-white/5">

          <p className="text-gray-400 text-[10px] uppercase tracking-widest px-4 pt-3 pb-2 border-b border-white/10 font-bold">
            Trip Timeline
          </p>

          <div className="divide-y divide-white/5">
            {timeline.map((event, idx) => {
              const isNext = nextEvent?.id === event.id;
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 px-4 py-2.5
                    ${event.isPast ? "opacity-40" : ""}
                    ${isNext ? "bg-white/10" : ""}
                  `}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center self-stretch pt-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0
                      ${isNext
                        ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-black " +
                          dotMap[event.color]
                        : dotMap[event.color]
                      }`}
                    />
                    {idx < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-white/10 mt-1" />
                    )}
                  </div>

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{event.icon}</span>
                      <span className={`text-sm font-semibold truncate
                        ${event.isPast ? "text-gray-500" : "text-white"}`}>
                        {event.label}
                      </span>
                      {isNext && (
                        <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                          NEXT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-sans">
                      {new Date(event.datetime).toLocaleDateString("en-GB", {
                        weekday: "short", month: "short", day: "numeric"
                      })}
                      {" · "}
                      {new Date(event.datetime).toLocaleTimeString("en-GB", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>

                  {/* Relative time badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 font-sans
                    ${event.isPast
                      ? "bg-gray-700 text-gray-400"
                      : event.isSoon
                        ? "bg-red-500 text-white animate-pulse"
                        : colorMap[event.color]
                    }`}>
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
