// ─────────────────────────────────────────────
// FILE: src/pages/Sessions.tsx
// PURPOSE: Renders the list of scientific sessions, with staff visibility and coming soon bypasses.
// ─────────────────────────────────────────────

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { getLabel } from '../utils/labels';
import { getPageAccess } from '../utils/pageAccess';

/**
 * Sessions component renders the list/grid of scientific sessions.
 */
export default function Sessions() {
  const { sessions, currentUser, appConfig } = useApp();

  const pageTitle = getLabel(appConfig, "sessions");

  const access = getPageAccess("sessions", currentUser?.role, appConfig);

  // Hidden Check
  if (access === "hidden") {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 font-sans">
          <p className="text-gray-400 text-sm">This page is not available.</p>
        </div>
      </Layout>
    );
  }

  // Coming Soon Check
  if (access === "coming-soon") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center text-center px-6 py-20 font-sans">
          <span className="text-5xl mb-4">🔒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-500 mb-6 font-medium text-sm">
            This feature is currently under development and will be available soon.
          </p>
        </div>
      </Layout>
    );
  }

  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;

  const sortedSessions = [...sessions].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.time || "").localeCompare(b.time || "");
  });

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold border border-yellow-200">
          {sessions.length} sessions
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedSessions.length > 0 ? (
          sortedSessions.map((s: any) => (
            <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col">
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100 mb-2 inline-block">Session</span>
                <h3 className="font-bold text-xl text-gray-900 leading-tight mb-1">{s.title}</h3>
                <p className="text-sm text-blue-600 font-bold uppercase">🗣 {s.speaker}</p>
              </div>
              
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                   <span className="font-bold">⏰ {s.time}{s.toTime ? ` – ${s.toTime}` : ""}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                   <span className="font-bold">📅 {s.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                   <span className="font-bold">🏛 Hall: {s.hall}</span>
                </div>
              </div>

              {s.link && (
                <a 
                  href={s.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full bg-black text-white text-center py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Join / Open Link
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
            <span className="text-4xl mb-4 block">🎓</span>
            <p className="text-gray-500 font-bold">No scientific sessions scheduled yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
