import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useApp } from "../context/AppContext";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface Checkin {
  id: string;
  title: string;
  rolesAllowed: string[];
  trip: string;
  active: boolean;
  createdAt: number;
}

export default function Checkins() {
  const { currentUser, users } = useApp();
  const fullUser = users.find((u) => u.id === currentUser?.id) || currentUser;

  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track check-ins already responded
  const [respondedIds, setRespondedIds] = useState<string[]>(() => {
    const list: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("euc_checked_in_")) {
          const checkinId = key.replace("euc_checked_in_", "");
          list.push(checkinId);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return list;
  });

  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchActiveCheckins = () => {
    if (!fullUser || !fullUser.role) return;

    setLoading(true);
    setError(null);

    const roleQuery = encodeURIComponent(fullUser.role.trim());
    fetch(`/api/checkins/active?role=${roleQuery}&trip=departure`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load active check-ins");
        }
        return res.json();
      })
      .then((data) => {
        setCheckins(data.checkins || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchActiveCheckins();
  }, [fullUser]);

  const handleRespond = async (checkinId: string) => {
    if (!fullUser) return;
    setSubmittingId(checkinId);

    const payload = {
      checkinId,
      username: fullUser.username || fullUser.username_github || "guest_" + Date.now(),
      fullname: fullUser.name || fullUser.fullname || fullUser.username || "Guest User",
      role: fullUser.role || "attendee",
    };

    try {
      const res = await fetch("/api/checkins/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        localStorage.setItem(`euc_checked_in_${checkinId}`, "true");
        setRespondedIds((prev) => [...prev, checkinId]);
      } else {
        const errData = await res.json();
        if (res.status === 409) {
          // Already responded status
          localStorage.setItem(`euc_checked_in_${checkinId}`, "true");
          setRespondedIds((prev) => [...prev, checkinId]);
        } else {
          alert(`Submission error: ${errData.error || "Please try again later"}`);
        }
      }
    } catch (e: any) {
      alert(`Network error: ${e.message || "Failed to submit response"}`);
    } finally {
      setSubmittingId(null);
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
              Log your position and airport progress keypoints. Your role:{" "}
              <span className="text-yellow-400 font-bold uppercase">{fullUser?.role || "Visitor"}</span>
            </p>
          </div>
          <button
            onClick={fetchActiveCheckins}
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
        ) : checkins.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
            <span className="text-4xl block mb-3">📍</span>
            <p className="text-gray-550 font-bold text-sm">No active check-ins at this moment</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Please check back when you arrive at key points of your departure itinerary.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checkins.map((item) => {
              const hasDone = respondedIds.includes(item.id);
              const isSubmitting = submittingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-yellow-300"
                >
                  <div className="flex-1 space-y-1.5">
                    <span className="inline-flex text-[9px] font-black uppercase tracking-wider bg-yellow-105 text-yellow-800 border border-yellow-250 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                    <h3 className="font-extrabold text-gray-950 text-base md:text-lg leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-450 font-semibold font-mono">
                      Published on {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {hasDone ? (
                      <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-black uppercase tracking-widest shadow-inner">
                        ✓ Done & Saved
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleRespond(item.id)}
                        className="w-full md:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer border-none"
                      >
                        {isSubmitting ? "Submitting..." : "I arrived 📍"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
