import React from "react";
import Layout from "../components/Layout";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { writeJSON } from "../utils/github";

export default function Messages() {
  const { messages, setMessages, currentUser } = useApp() as any;
  const navigate = useNavigate();

  const handleRead = (id: string, index: number) => {
    if (!currentUser || !messages) return;
    const msg = messages.find((m: any) => m.id === id);
    if (!msg || (msg.readBy && msg.readBy.includes(currentUser.id))) return;

    const updated = [...messages];
    const msgIndex = updated.findIndex((m: any) => m.id === id);
    if (msgIndex !== -1) {
      updated[msgIndex] = { ...msg, readBy: [...(msg.readBy || []), currentUser.id] };
      // Note: Admin messages are managed centrally, but to prevent losing global reads,
      // actual read-receipt saving to GitHub would be complex if multi-user.
      // We will optimistically update local state to clear the unread badge.
      setMessages && setMessages(updated);
    }
  };

  if (!messages) return <Layout><div className="p-8 text-center">Loading...</div></Layout>;

  const now = new Date().toISOString();
  const validMessages = messages.filter((m: any) => {
    if (m.status !== "published") return false;
    if (m.expiresAt && m.expiresAt <= now) return false;
    return true;
  });
  
  const sortMessages = (list: any[]) => {
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const tA = new Date(a.publishedAt || 0).getTime();
      const tB = new Date(b.publishedAt || 0).getTime();
      return tB - tA;
    });
  };

  const highMessages = sortMessages(validMessages.filter((m: any) => m.priority === "high"));
  const normalMessages = sortMessages(validMessages.filter((m: any) => m.priority !== "high"));

  const hasMessages = highMessages.length > 0 || normalMessages.length > 0;

  const renderButtons = (buttons: any[]) => {
    if (!buttons || buttons.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {buttons.map((b, i) => {
          let btnClass = "";
          if (b.style === "primary") btnClass = "bg-black text-white hover:bg-gray-800";
          if (b.style === "secondary") btnClass = "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200";
          if (b.style === "ghost") btnClass = "text-black underline bg-transparent hover:text-gray-600";
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                if (b.link.startsWith("http")) window.open(b.link, "_blank");
                else navigate(b.link);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${btnClass}`}
            >
              {b.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-6">
        <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
          <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          Messages
        </h1>

        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="font-bold">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {highMessages.length > 0 && (
              <div className="space-y-4">
                {highMessages.map((msg, idx) => {
                  const isRead = currentUser && msg.readBy && msg.readBy.includes(currentUser.id);
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleRead(msg.id, idx)}
                      className={`bg-amber-50 border border-amber-300 rounded-xl p-4 cursor-pointer relative shadow-sm transition-all hover:shadow-md ${!isRead ? "border-l-4 border-l-yellow-500" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {msg.pinned && <span className="text-amber-600 text-sm">📌</span>}
                          {msg.title}
                        </h2>
                        {isRead && <span className="text-xs text-gray-500 flex items-center gap-1 font-bold">✓ Read</span>}
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>
                      {renderButtons(msg.buttons)}
                    </div>
                  );
                })}
              </div>
            )}

            {normalMessages.length > 0 && (
              <div className="space-y-4">
                {normalMessages.map((msg, idx) => {
                  const isRead = currentUser && msg.readBy && msg.readBy.includes(currentUser.id);
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleRead(msg.id, idx)}
                      className={`bg-white border border-gray-100 rounded-xl p-4 cursor-pointer shadow-sm transition-all hover:shadow-md ${!isRead ? "border-l-4 border-l-yellow-400" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {msg.pinned && <span className="text-gray-400 text-sm">📌</span>}
                          {msg.title}
                        </h2>
                        {isRead && <span className="text-xs text-gray-400 flex items-center gap-1 font-bold">✓ Read</span>}
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.body}</p>
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
