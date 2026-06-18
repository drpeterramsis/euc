import { useState, useEffect } from "react";
import { apiUrl } from "../utils/api";

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

interface CheckinsSectionProps {
  user: any;
}

export default function CheckinsSection({ user }: CheckinsSectionProps) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track check-ins user has already submitted during this session or local state
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

  useEffect(() => {
    if (!user || !user.role) return;

    setLoading(true);
    setError(null);

    const roleQuery = user.role.trim();
    fetch(apiUrl("checkins", { action: "active", role: roleQuery, trip: "departure" }))
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
  }, [user]);

  const handleRespond = async (checkinId: string) => {
    if (!user) return;
    setSubmittingId(checkinId);

    const payload = {
      action: "checkins.respond",
      checkinId,
      username: user.username || user.username_github || "guest_" + Date.now(),
      fullname: user.name || user.fullname || user.username || "Guest User",
      role: user.role || "attendee",
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
        // Success
        localStorage.setItem(`euc_checked_in_${checkinId}`, "true");
        setRespondedIds([...respondedIds, checkinId]);
      } else {
        const errData = await res.json();
        if (res.status === 409) {
          // Already responded
          localStorage.setItem(`euc_checked_in_${checkinId}`, "true");
          setRespondedIds([...respondedIds, checkinId]);
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

  if (!user || checkins.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-8 text-gray-900 font-sans shadow-xs animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">✈️</span>
        <h3 className="font-extrabold text-sm text-yellow-800 uppercase tracking-wider">
          Trip Departure Check-ins
        </h3>
      </div>
      <p className="text-xs text-yellow-700 font-medium mb-4 leading-relaxed">
        Please complete the active check-ins as you proceed with your departure itinerary.
      </p>

      {error ? (
        <p className="text-xs text-red-500 font-bold">Error: {error}</p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-xs py-2 text-yellow-700">
          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
          <span>Searching active check-ins...</span>
        </div>
      ) : (
        <div className="space-y-3.5">
          {checkins.map((item) => {
            const hasDone = respondedIds.includes(item.id);
            const isSubmitting = submittingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white p-4 rounded-xl border border-yellow-105 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all"
              >
                <div className="flex-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-yellow-600 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded">
                    Active
                  </span>
                  <h4 className="font-bold text-gray-900 mt-1 pb-0.5 text-sm sm:text-base leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono">
                    Published: {new Date(item.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <div>
                  {hasDone ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-black shadow-inner uppercase tracking-widest">
                      ✓ Done
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleRespond(item.id)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-black text-xs uppercase tracking-wider shadow-sm transition-all disabled:bg-gray-150 active:scale-95 cursor-pointer"
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
  );
}
