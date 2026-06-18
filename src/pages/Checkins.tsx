import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useApp } from "../context/AppContext";
import { showToast } from "../components/Toast";
import { apiUrl } from "../utils/api";

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

interface TripItem {
  id: string;
  title: string;
  active: boolean;
  createdAt?: number;
}

export default function Checkins() {
  const { currentUser, users } = useApp();
  const fullUser = users.find((u) => u.id === currentUser?.id) || currentUser;

  const [trips, setTrips] = useState<TripItem[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    return localStorage.getItem("selected_trip_id") || "departure";
  });

  const [categories, setCategories] = useState<CategoryWithCheckins[]>([]);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Load Trips List
  useEffect(() => {
    fetch(apiUrl("trips", { action: "list" }))
      .then((res) => res.json())
      .then((data) => {
        const list = data.trips || [];
        setTrips(list);
        if (list.length > 0) {
          const exists = list.some((t: any) => t.id === selectedTripId);
          if (!exists) {
            // Pick first active trip, or just first trip in list
            const firstActive = list.find((t: any) => t.active);
            const fallbackId = firstActive ? firstActive.id : list[0].id;
            setSelectedTripId(fallbackId);
            localStorage.setItem("selected_trip_id", fallbackId);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load trips", err);
        showToast("Failed to retrieve trip segments list", "error");
      });
  }, []);

  const fetchCheckinsData = () => {
    if (!fullUser || !fullUser.role || !fullUser.username || !selectedTripId) return;

    setLoading(true);
    setError(null);

    const roleParam = fullUser.role.trim();
    const usernameParam = fullUser.username.trim();
    const tripParam = selectedTripId;

    fetch(
      apiUrl("checkins", {
        action: "activeByTrip",
        tripId: tripParam,
        role: roleParam,
        username: usernameParam,
      })
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load active check-ins for the selected trip.");
        }
        return res.json();
      })
      .then((data) => {
        setCategories(data.categories || []);
        setTotalPending(data.totalPending || 0);
      })
      .catch((err) => {
        setError(err.message);
        showToast(`Failed loading checkpoints: ${err.message}`, "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCheckinsData();
  }, [fullUser, selectedTripId]);

  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTripId(val);
    localStorage.setItem("selected_trip_id", val);
  };

  const handleToggleCheckin = async (id: string, currentlyChecked: boolean) => {
    if (!fullUser) return;
    setActionLoadingId(id);

    const payload = {
      action: currentlyChecked ? "checkins.uncheck" : "checkins.check",
      checkinId: id,
      username: fullUser.username,
      fullname: fullUser.fullname || fullUser.username,
      role: fullUser.role,
    };

    try {
      const res = await fetch(apiUrl("checkins"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(currentlyChecked ? "Check-in undone successfully" : "Successfully checked in!", "success");
        // Optimistic UI updates to avoid hard lagging
        setCategories(prev => prev.map(cat => ({
          ...cat,
          checkins: cat.checkins.map(item => item.id === id ? { ...item, checked: !currentlyChecked } : item)
        })));
        // Refresh full back-end state silently
        fetchCheckinsData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Action failed.", "error");
      }
    } catch (err: any) {
      showToast(`Network Error: ${err.message}`, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 font-sans text-gray-900">
        
        {/* Global Trip Segment Selector Dropdown */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Trip Segment Selector</p>
              <p className="text-xs font-semibold text-gray-700">Currently viewing milestones of selected itinerary</p>
            </div>
          </div>
          <select
            value={selectedTripId}
            onChange={handleTripChange}
            className="w-full sm:w-64 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:border-yellow-400"
          >
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} {!t.active ? "(Inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Banner Section */}
        <div className="bg-black text-white p-6 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-800 shadow-md">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>✈️</span> {selectedTrip?.title || "Trip Milestones"}
            </h1>
            <p className="text-xs md:text-sm text-gray-400 font-medium leading-relaxed">
              Complete your segment checkpoints and travel progress. Your role:{" "}
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
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Searching checkpoints...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
            <span className="text-4xl block mb-3">📍</span>
            <p className="text-gray-550 font-bold text-sm">No active checkpoints configured for this trip</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Please check in later or choose another trip itinerary segment.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
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
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-gray-950">
                                  {item.title}
                                </h4>
                                {!item.active && (
                                  <span className="text-[10px] font-bold uppercase text-red-500 bg-red-50 px-1.5 rounded">Draft</span>
                                )}
                              </div>
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
