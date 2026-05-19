/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { getLabel } from '../utils/labels';

/**
 * Schedule component renders the trip schedule timeline.
 */
export default function Schedule() {
  const { schedule, currentUser, appConfig } = useApp();

  const viewAs = sessionStorage.getItem("euc_view_as");
  const displayUser = viewAs ? JSON.parse(viewAs) : currentUser;

  const filtered = schedule.map((day: any) => ({
    ...day,
    items: (day.items || []).filter((item: any) => {
      if (!item.accessRoles && !item.accessUserIds) return true;
      return item.accessRoles?.includes(displayUser?.role) || 
             item.accessUserIds?.includes(displayUser?.id);
    })
  })).filter(day => day.items.length > 0);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{getLabel(appConfig, "schedule")}</h1>
        <div className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">PRAGUE-2026</div>
      </div>
      
      <div className="space-y-8">
        {filtered.length > 0 ? (
          filtered.map((day: any) => (
            <div key={day.id} className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-yellow-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-sm">
                  {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 h-[2px] bg-gray-100 italic text-[10px] text-gray-300 font-bold tracking-widest pl-4">{day.title?.toUpperCase()}</div>
              </div>
              
              <div className="space-y-4 ml-4 sm:ml-8 border-l-2 border-dashed border-gray-200">
                {day.items.map((item: any, i: number) => (
                    <div key={item.id || i} className="relative pl-8 pb-4 group last:pb-0">
                        {/* Dot */}
                        <div className="absolute left-[-5px] top-1.5 w-[9px] h-[9px] rounded-full bg-white border-2 border-yellow-500 group-hover:bg-yellow-500 transition-colors"></div>
                        
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                item.category === "Scientific" ? "bg-blue-100 text-blue-700" :
                                item.category === "Social" ? "bg-purple-100 text-purple-700" :
                                item.category === "Transport" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                              }`}>{item.category || "OTHER"}</span>
                              <h3 className="font-bold text-gray-900 mt-1">{item.activity}</h3>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                                <span>⏰ {item.time}{item.endTime ? ` – ${item.endTime}` : ""}</span>
                                {item.location && <span className="truncate">📍 {item.location}</span>}
                              </div>
                              {item.notes && <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded italic">"{item.notes}"</p>}
                            </div>
                            
                            <div className="flex flex-col gap-2 min-w-[120px]">
                              {item.link && (
                                <a 
                                  href={item.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-center bg-black text-white py-1.5 rounded hover:bg-gray-800 transition-colors uppercase tracking-tight"
                                >
                                  Open Link
                                </a>
                              )}
                              {item.mapLocation && (
                                <a 
                                  href={item.mapLocation.startsWith('http') ? item.mapLocation : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapLocation)}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-center border-2 border-gray-900 text-gray-900 py-1.5 rounded hover:bg-gray-50 transition-colors uppercase tracking-tight"
                                >
                                  View on Map
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                    </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <span className="text-5xl mb-4 block">📅</span>
            <p className="text-gray-500 font-bold">No schedule items available for your role.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
