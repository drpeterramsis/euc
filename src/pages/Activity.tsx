import React, { useState } from "react";
import Layout from "../components/Layout";
import { useApp, matchesRole } from "../context/AppContext";
import { getPageAccess } from "../lib/pageAccess";
import ComingSoon from "../components/ComingSoon";

export default function Activity() {
  const { messages, currentUser, content, schedule, sessions } = useApp() as any;
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications' | 'schedule' | 'sessions' | 'checkins'>('messages');
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const tabs = [
    { id: 'messages', label: 'Messages' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'checkins', label: 'Check-ins' },
  ] as const;

  const centralAccess = content?.settings 
    ? getPageAccess(currentUser?.id || "", currentUser?.role || "", activeTab === 'messages' ? "announcements" : activeTab, content.settings)
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

  // Filter logic based on active tab
  const getItems = () => {
    switch (activeTab) {
      case 'messages':
        return messages.filter((m: any) => m.category !== 'notification' && (filterCategory === "all" || m.category === filterCategory));
      case 'notifications':
        return messages.filter((m: any) => m.category === 'notification' && (filterCategory === "all" || m.category === filterCategory));
      case 'schedule':
        return schedule; // Adjust or filter based on user if needed
      case 'sessions':
        return sessions;
      case 'checkins':
        return []; // Need to fetch checkins if available
      default:
        return [];
    }
  };

  const filteredItems = getItems();
  const categories = activeTab === 'messages' || activeTab === 'notifications' 
    ? ["all", ...new Set(messages.map((m: any) => m.category || "General"))]
    : [];

  return (
    <Layout>
      <div className="flex flex-col mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
          {categories.length > 0 && (
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            >
              {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No {activeTab} to show.</p>
        ) : (
          filteredItems.map((item: any, idx: number) => (
            <div key={item.id || idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-1">{item.title || item.name || "Item"}</h3>
              <p className="text-sm text-gray-600 mb-3">{item.message || item.description || ""}</p>
              <div className="flex justify-between items-center text-xs text-gray-400 font-bold">
                <span>{item.category || item.type || "General"}</span>
                {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString()}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
