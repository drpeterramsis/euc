import React, { useState } from "react";
import Layout from "../components/Layout";
import { useApp, matchesRole } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { writeJSON } from "../utils/github";
import { ensureHttps } from "../utils/linkUtils";
import { getPageAccess } from "../lib/pageAccess";
import ComingSoon from "../components/ComingSoon";

export default function Messages() {
  const { messages, updateMessages, currentUser, content } = useApp() as any;
  const navigate = useNavigate();
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const centralAccess = content?.settings 
    ? getPageAccess(content.settings, currentUser?.id || "", "announcements")
    : { enabled: true, comingSoon: false };

  if (!centralAccess.enabled) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-semibold text-gray-500">Not Found</h1>
        </div>
      </Layout>
    );
  }

  if (centralAccess.comingSoon) {
    return (
      <Layout>
        <ComingSoon />
      </Layout>
    );
  }

  const handleRead = (id: string, index: number) => {
    if (!currentUser || !messages) return;
    const msg = messages.find((m: any) => m.id === id);
    if (!msg || (msg.readBy && msg.readBy.includes(currentUser.id))) return;

    const updated = [...messages];
    const msgIndex = updated.findIndex((m: any) => m.id === id);
    if (msgIndex !== -1) {
      updated[msgIndex] = { ...msg, readBy: [...(msg.readBy || []), currentUser.id] };
      updateMessages && updateMessages(updated);
      
      // Persist the read mark immediately to the server
      writeJSON("messages.json", updated).catch(() => null);
    }
  };

  if (!messages) return <Layout><div className="p-8 text-center text-gray-500 font-medium">Loading Messages...</div></Layout>;

  const isMessageVisible = (m: any) => {
    if (!currentUser) return false;
    const audienceObj = m.audience || m.recipients || m.targetRole || "all";
    return matchesRole(audienceObj, currentUser.role);
  };

  const now = new Date().toISOString();
  let validMessages = messages.filter((m: any) => {
    if (m.status !== "published") return false;
    if (m.expiresAt && m.expiresAt <= now) return false;
    if (!isMessageVisible(m)) return false;
    return true;
  });

  if (filterCategory !== "all") {
    validMessages = validMessages.filter((m: any) => m.category === filterCategory);
  }
  
  const sortMessages = (list: any[]) => {
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const tA = new Date(a.publishedAt || a.scheduledAt || 0).getTime();
      const tB = new Date(b.publishedAt || b.scheduledAt || 0).getTime();
      if (tA !== tB) return tB - tA;
      return String(b.id).localeCompare(String(a.id));
    });
  };

  const highMessages = sortMessages(validMessages.filter((m: any) => m.priority === "high"));
  const normalMessages = sortMessages(validMessages.filter((m: any) => m.priority !== "high"));

  const hasMessages = highMessages.length > 0 || normalMessages.length > 0;

  const renderButtons = (buttons: any[]) => {
    if (!buttons || buttons.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-auto pt-3">
        {buttons.map((b, i) => {
          let btnClass = "";
          if (b.style === "primary") btnClass = "bg-black text-white hover:bg-gray-800";
          if (b.style === "secondary") btnClass = "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200";
          if (b.style === "ghost") btnClass = "text-black underline bg-transparent hover:text-gray-600";
          
          const safeUrl = ensureHttps(b.link);
          const isExternal = safeUrl.startsWith("http") || safeUrl.startsWith("mailto:") || safeUrl.startsWith("tel:");

          if (isExternal) {
            return (
              <a
                key={i}
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors whitespace-normal break-words inline-block text-center ${btnClass}`}
              >
                {b.label}
              </a>
            );
          }
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                navigate(safeUrl);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors whitespace-normal break-words inline-block text-center border-none cursor-pointer ${btnClass}`}
            >
              {b.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderCategoryBadge = (category: string) => {
    if (!category) return null;
    const isUrgent = category === "urgent";
    const badgeCls = isUrgent ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";
    return (
      <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full ${badgeCls}`}>
        {category}
      </span>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            Messages
          </h1>
          <div className="w-full sm:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="schedule">Schedule</option>
              <option value="logistics">Logistics</option>
              <option value="urgent">Urgent</option>
              <option value="social">Social</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="font-bold">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {highMessages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {highMessages.map((msg, idx) => {
                  const isRead = currentUser && msg.readBy && msg.readBy.includes(currentUser.id);
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleRead(msg.id, idx)}
                      className={`bg-amber-50 border border-amber-300 rounded-xl p-4 cursor-pointer relative shadow-sm transition-all hover:shadow-md flex flex-col items-start ${!isRead ? "border-l-4 border-l-yellow-500" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-2 w-full gap-2">
                        <div className="flex items-start gap-2 flex-grow">
                          {msg.pinned && <span className="text-amber-600 text-sm flex-shrink-0 mt-0.5">📌</span>}
                          <h2 className="font-bold text-gray-900 text-lg leading-tight break-words">{msg.title}</h2>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {isRead && <span className="text-xs text-gray-500 flex items-center gap-1 font-bold">✓ Read</span>}
                          {renderCategoryBadge(msg.category)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words w-full mb-2">{msg.body}</p>
                      {renderButtons(msg.buttons)}
                    </div>
                  );
                })}
              </div>
            )}

            {normalMessages.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {normalMessages.map((msg, idx) => {
                  const isRead = currentUser && msg.readBy && msg.readBy.includes(currentUser.id);
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleRead(msg.id, idx)}
                      className={`bg-white border border-gray-100 rounded-xl p-4 cursor-pointer shadow-sm transition-all hover:shadow-md flex flex-col items-start ${!isRead ? "border-l-4 border-l-yellow-400" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-2 w-full gap-2">
                        <div className="flex items-start gap-2 flex-grow">
                          {msg.pinned && <span className="text-gray-400 text-sm flex-shrink-0 mt-0.5">📌</span>}
                          <h2 className="font-bold text-gray-900 text-lg leading-tight break-words">{msg.title}</h2>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {isRead && <span className="text-xs text-gray-400 flex items-center gap-1 font-bold">✓ Read</span>}
                          {renderCategoryBadge(msg.category)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap break-words w-full mb-2">{msg.body}</p>
                      {renderButtons(msg.buttons)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
