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
    ? getPageAccess(currentUser?.id || "", currentUser?.role || "", "announcements", content.settings)
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

  const filteredMessages = messages.filter((m: any) => {
    if (filterCategory === "all") return true;
    return m.category === filterCategory;
  });

  const categories = ["all", ...new Set(messages.map((m: any) => m.category || "General"))];

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
        >
          {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>
      
      <div className="space-y-4">
        {filteredMessages.map((m: any) => (
          <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-1">{m.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{m.message}</p>
            <div className="flex justify-between items-center text-xs text-gray-400 font-bold">
              <span>{m.category || "General"}</span>
              <span>{new Date(m.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
