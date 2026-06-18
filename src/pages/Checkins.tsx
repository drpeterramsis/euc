import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useApp } from "../context/AppContext";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface CheckinItem {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  buttonTitle: string;
  rolesAllowed: string[];
  checked: boolean;
}

interface CategoryWithCheckins {
  id: string;
  emoji: string;
  title: string;
  details: string;
  checkins: CheckinItem[];
  pendingCount: number;
}

export default function Checkins() {
  const { currentUser, users } = useApp();
  const fullUser = users.find((u) => u.id === currentUser?.id) || currentUser;

  const [categories, setCategories] = useState<CategoryWithCheckins[]>([]);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCheckinsData = () => {
    if (!fullUser || !fullUser.role || !fullUser.username) return;

    setLoading(true);
    setError(null);

    const roleParam = encodeURIComponent(fullUser.role.trim());
    const usernameParam = encodeURIComponent(fullUser.username.trim());

    fetch(`/api/checkins/activeByTrip?trip=departure&role=${roleParam}&username=${usernameParam}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load active check-ins grouped by categories.");
        }
        return res.json();
      })
      .then((data) => {
        setCategories(data.categories || []);
        setTotalPending(data.totalPending || 0);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCheckinsData();
  }, [fullUser]);

  const handleToggleCheckin = async (id: string, currentlyChecked: boolean) => {
    if (!fullUser) return;
    setActionLoadingId(id);

    const payload = {
      checkinId: id,
      username: fullUser.username,
      fullname: fullUser.fullname || fullUser.username,
      role: fullUser.role,
    };

    const endpoint = currentlyChecked ? "/api/checkins/uncheck" : "/api/checkins/check";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Refresh checkins state
        fetchCheckinsData();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to perform action."}`);
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 font-sans text-gray-900">
        
        {/* Banner Section */}
        <div className="bg-black text-white p-6 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-800 shadow-md">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>✈️</span> Departure Check-ins
            </h1>
            <p className="text-xs md:text-sm text-gray-400 font-medium leading-relaxed">
              Complete your airport milestones and progress. Your role:{" "}
              <span className="text-yellow-400 font-bold uppercase">{fullUser?.role || "Passenger"}</span>
            </p>
          </div>
          <button
            onClick={fetchCheckinsData}
            className="self-start md:self-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer border-none"
          >
            🔄 Refresh List
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 font-semibold rounded-xl text-center text-xs mb-6">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Searching active check-ins...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
            <span className="text-4xl block mb-3">📍</span>
            <p className="text-gray-550 font-bold text-sm">No categories or active check-ins configured</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Please ask administrators to create check-ins for this itinerary.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              // Only render category if there are check-ins or it's active
              const hasCheckins = category.checkins.length > 0;
              
              return (
                <div key={category.id} className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-5 border-b border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-3">
                     <div className="flex items-start gap-3">
                         <span className="text-3xl p-1">{category.emoji || "📍"}</span>
                         <div>
                            <h3 className="font-extrabold text-gray-950 text-base md:text-lg">
                               {category.title}
                            </h3>
                            {category.details && (
                               <p className="text-xs text-gray-500 font-medium mt-0.5">{category.details}</p>
                            )}
                         </div>
                     </div>
                     <div className="self-start md:self-auto">
                        {category.pendingCount > 0 ? (
                           <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                              ⏳ {category.pendingCount} Pending
                           </span>
                        ) : hasCheckins ? (
                           <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                              ✓ Completed
                           </span>
                        ) : (
                           <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold">
                              No steps
                           </span>
                        )}
                     </div>
                  </div>

                  {/* Category Check-ins List */}
                  {category.checkins.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400 font-medium">
                      No active milestones available for your role within this category yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {category.checkins.map((item) => {
                        const isActionLoading = actionLoadingId === item.id;
                        return (
                          <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50 transition-colors">
                            <div className="flex-1 space-y-1">
                              <h4 className="font-extrabold text-sm text-gray-950">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                 {item.rolesAllowed.map((r) => (
                                    <span key={r} className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                                       {r}
                                    </span>
                                 ))}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleToggleCheckin(item.id, item.checked)}
                                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                                  item.checked
                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                    : "bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-500"
                                }`}
                              >
                                {isActionLoading ? "..." : item.checked ? "Undo check-in ✕" : item.buttonTitle}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
