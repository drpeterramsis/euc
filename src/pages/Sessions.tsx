// ─────────────────────────────────────────────
// FILE: src/pages/Sessions.tsx
// PURPOSE: Renders the list of scientific sessions, with staff visibility and coming soon bypasses,
//          now including speaker photos and WhatsApp "Ask Speaker" popup.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
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

  // ASK SPEAKER POPUP STATE
  const [activeQuestionSession, setActiveQuestionSession] = useState<any | null>(null);
  const [questionSenderName, setQuestionSenderName] = useState("");
  const [questionText, setQuestionText] = useState("");

  const pageTitle = getLabel(appConfig, "sessions");

  const centralAccess = content?.settings 
    ? getCentralPageAccess(currentUser?.id || "", currentUser?.role || "", "posts", content.settings)
    : { enabled: true, comingSoon: false };

  // Hidden Check
  if (!centralAccess.enabled) {
    return <Navigate to="/access-denied" replace />;
  }

  // ✅ ONLY use getPageAccess — NEVER check appConfig.pages directly
  const access = getPageAccess("sessions", currentUser?.role, appConfig);

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

  // Active state for selecting and filtering scientific sessions by specific dates/days
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Gather unique and sorted available dates from existing loaded sessions
  const availableDates = Array.from(new Set(sessions.map((s: any) => (s.date || "") as string)))
    .filter(Boolean)
    .sort((a: string, b: string) => a.localeCompare(b));

  // Sync selectedDate with first date in list if current state is empty or invalid
  useEffect(() => {
    if (availableDates.length > 0) {
      if (!selectedDate || !availableDates.includes(selectedDate)) {
        setSelectedDate(availableDates[0]);
      }
    } else {
      setSelectedDate("");
    }
  }, [sessions, selectedDate]);

  const sortedSessions = [...sessions].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.time || "").localeCompare(b.time || "");
  });

  // Filter sorted sessions based on selected date grouping/toggle
  const filteredSessions = sortedSessions.filter((s: any) => !selectedDate || s.date === selectedDate);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <span className="text-sm bg-yellow-105 text-yellow-800 px-3 py-1 rounded-full font-bold border border-yellow-250">
          {sessions.length} sessions
        </span>
      </div>

      {/* Interactive Date/Day Selection Toggle Slider to Switch Between Scientific Session Days */}
      {availableDates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-gray-50 rounded-xl border border-gray-150 max-w-fit shadow-xs">
          {availableDates.map((dateStr) => {
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={`px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white text-gray-950 border border-gray-250 shadow-sm font-black"
                    : "text-gray-550 hover:text-gray-900 font-medium"
                }`}
              >
                📅 {dateStr}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((s: any) => (
            <div
              key={s.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col"
            >
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-105 mb-2 inline-block">
                  Session
                </span>
                <h3 className="font-bold text-xl text-gray-900 leading-tight mb-3">
                  {s.title}
                </h3>
                
                  {/* Speaker profile container rendering photo dynamically */}
                  <div className="flex items-center gap-2.5">
                    {s.speakerPhoto ? (
                      <img 
                        src={s.speakerPhoto} 
                        alt={s.speaker}
                        className="w-25 h-25 rounded-full object-cover border border-gray-250 shadow-sm flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                        👤
                      </div>
                    )}
                    <div className="flex flex-col">
                      <p className="text-sm text-blue-600 font-bold uppercase">
                        🗣 {s.speaker}
                      </p>
                      {s.speakerJob && (
                        <p className="text-xs text-gray-500 font-medium whitespace-pre-wrap mt-0.5">
                          💼 {s.speakerJob}
                        </p>
                      )}
                    </div>
                  </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
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
                          const startResult = splitAmPm(prague.time);
                          if (s.toTime) {
                            const endUtc = (() => {
                              const [sh, sm] = (s.time || "00:00").split(":").map(Number);
                              const [eh, em] = s.toTime.split(":").map(Number);
                              if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
                              const startMins = sh * 60 + sm;
                              let endMins = eh * 60 + em;
                              if (endMins < startMins) endMins += 24 * 60;
                              const diffMins = endMins - startMins;
                              const startD = new Date(rawDate);
                              return new Date(startD.getTime() + diffMins * 60 * 1000).toISOString();
                            })();
                            if (endUtc) {
                              const pragueEnd = utcToDisplay(endUtc, "Europe/Prague");
                              const endResult = splitAmPm(pragueEnd.time);
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-amber-150 border border-amber-300 text-amber-900 font-bold whitespace-nowrap">
                                  🇨🇿 {startResult.digits} {startResult.period} - {endResult.digits} {endResult.period} (Prague)
                                </span>
                              );
                            }
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 border border-amber-300 text-amber-900 font-bold whitespace-nowrap">
                              🇨🇿 {startResult.digits}<span className="text-[10px] font-semibold text-amber-500 ml-0.5">{startResult.period}</span>
                            </span>
                          );
                        })()}
                        {showCairo && (() => {
                          const startResult = splitAmPm(cairo.time);
                          if (s.toTime) {
                            const endUtc = (() => {
                              const [sh, sm] = (s.time || "00:00").split(":").map(Number);
                              const [eh, em] = s.toTime.split(":").map(Number);
                              if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
                              const startMins = sh * 60 + sm;
                              let endMins = eh * 60 + em;
                              if (endMins < startMins) endMins += 24 * 60;
                              const diffMins = endMins - startMins;
                              const startD = new Date(rawDate);
                              return new Date(startD.getTime() + diffMins * 60 * 1000).toISOString();
                            })();
                            if (endUtc) {
                              const cairoEnd = utcToDisplay(endUtc, "Africa/Cairo");
                              const endResult = splitAmPm(cairoEnd.time);
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-blue-50 border border-blue-200 text-blue-800 font-bold whitespace-nowrap">
                                  🇪🇬 {startResult.digits} {startResult.period} - {endResult.digits} {endResult.period} (Cairo)
                                </span>
                              );
                            }
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 border border-blue-200 text-blue-800 font-bold whitespace-nowrap">
                              🇪🇬 {startResult.digits}<span className="text-[10px] font-semibold text-amber-500 ml-0.5">{startResult.period}</span>
                            </span>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-650">
                  <span className="font-bold font-sans">📅 {s.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-650">
                  <span className="font-bold font-sans">🏛 Hall: {s.hall}</span>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="space-y-2 mt-auto">
                {(s.link || s.linkUrl) && (
                  <a
                    href={s.linkUrl || s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center bg-black text-white py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                  >
                    {s.linkTitle ? s.linkTitle : "Join / Open Link"}
                  </a>
                )}

                {/* WhatsApp Speaker interactive option */}
                {s.speakerWhatsApp && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveQuestionSession(s);
                      setQuestionSenderName(displayUser?.name || "");
                      setQuestionText("");
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-center py-2.5 rounded-lg font-bold text-sm hover:shadow-md transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    💬 Ask Speaker on WhatsApp
                  </button>
                )}
              </div>
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

      {/* Ask Speaker on WhatsApp interactive Popup Modal */}
      {activeQuestionSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6 space-y-4 my-8 animate-fade-in text-gray-900 font-sans">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-gray-950 font-extrabold text-lg flex items-center gap-2">
                <span>💬</span> Ask Speaker
              </h3>
              <button
                type="button"
                onClick={() => setActiveQuestionSession(null)}
                className="text-gray-400 hover:text-gray-650 cursor-pointer p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
              <p className="text-gray-500 font-medium font-sans">Session Title:</p>
              <p className="text-sm text-gray-950 font-bold leading-snug">{activeQuestionSession.title}</p>
              <p className="text-blue-600 font-bold mt-1 uppercase tracking-wide">Speaker: 🗣 {activeQuestionSession.speaker}</p>
            </div>

            <div className="space-y-1">
              <label className="text-gray-600 font-bold text-xs uppercase tracking-wider block">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Attendee name"
                value={questionSenderName}
                onChange={(e) => setQuestionSenderName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-400/35"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-600 font-bold text-xs uppercase tracking-wider block">
                Your Question <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Type your question for the speaker here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-400/35 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-150 font-bold">
              <button
                type="button"
                onClick={() => setActiveQuestionSession(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-750 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!questionText.trim()) {
                    alert("Please enter your question.");
                    return;
                  }
                  
                  const userName = questionSenderName.trim() || displayUser?.name || "Attendee";
                  const sessionTitle = activeQuestionSession.title;
                  
                  // Format timezone display nicely for message details
                  const rawDate = activeQuestionSession.datetime_utc || localToUtc(
                    `${activeQuestionSession.date}T${activeQuestionSession.time || "00:00"}`,
                    "Africa/Cairo"
                  );
                  const cairo = utcToDisplay(rawDate, "Africa/Cairo");
                  const prague = utcToDisplay(rawDate, "Europe/Prague");
                  
                  let dateTimeStr = `Date: ${activeQuestionSession.date}`;
                  const showPrague = (activeQuestionSession.timezoneDisplay ?? "both") === "both" || (activeQuestionSession.timezoneDisplay ?? "both") === "prague";
                  if (showPrague) {
                    dateTimeStr += ` at ${prague.time} (Prague)`;
                  } else {
                    dateTimeStr += ` at ${cairo.time} (Cairo)`;
                  }

                  const hallStr = activeQuestionSession.hall ? `Hall: ${activeQuestionSession.hall}` : "";
                  
                  let formattedMsg = `Hello Speaker,\n\nMy name is ${userName}.\nI have a question regarding your session "${sessionTitle}"`;
                  if (dateTimeStr) formattedMsg += `\n(${dateTimeStr})`;
                  if (hallStr) formattedMsg += `\n${hallStr}`;
                  formattedMsg += `\n\nQuestion:\n${questionText.trim()}`;

                  let rawPhone = activeQuestionSession.speakerWhatsApp || "";
                  rawPhone = rawPhone.replace(/[^\d+]/g, "");
                  const cleanPhoneNum = rawPhone.replace(/\+/g, "");
                  
                  const whatsappUrl = `https://wa.me/${cleanPhoneNum}?text=${encodeURIComponent(formattedMsg)}`;
                  window.open(whatsappUrl, "_blank");
                  setActiveQuestionSession(null);
                }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold shadow-sm cursor-pointer transition-colors"
              >
                Send on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

