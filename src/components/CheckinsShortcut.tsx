import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface CheckinsShortcutProps {
  user: any;
}

export default function CheckinsShortcut({ user }: CheckinsShortcutProps) {
  const navigate = useNavigate();
  const [totalPending, setTotalPending] = useState<number>(0);
  const [hasActiveCheckins, setHasActiveCheckins] = useState<boolean>(false);
  const [tripTitle, setTripTitle] = useState<string>("Checking state...");
  const [loading, setLoading] = useState(false);

  const selectedTripId = localStorage.getItem("selected_trip_id") || "departure";

  useEffect(() => {
    if (!user || !user.role || !user.username) return;

    setLoading(true);
    const roleParam = user.role.trim();
    const usernameParam = user.username.trim();
    const tripParam = selectedTripId;

    apiFetch("checkins/activeByTrip", {
      params: {
        tripId: tripParam,
        role: roleParam,
        username: usernameParam,
      },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        setTotalPending(data.totalPending || 0);
        setTripTitle(data.trip?.title || "Trip Milestones");
        const anyActive = (data.categories || []).some((c: any) => (c.checkins || []).length > 0);
        setHasActiveCheckins(anyActive);
      })
      .catch(() => {
        // Silently fallback labels
        setTripTitle("Trip Milestones");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, selectedTripId]);

  if (!user) return null;

  const isPending = totalPending > 0;

  return (
    <div
      className={`border rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between font-sans transition-all duration-300 ${
        isPending
          ? "bg-yellow-400 border-yellow-500 text-black animate-pulse"
          : "bg-gray-50 border-gray-200 text-gray-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">✈️</div>
        <div>
          <h4
            className={`font-black text-xs uppercase tracking-wide ${
              isPending ? "text-black" : "text-gray-500"
            }`}
          >
            Check-ins ({tripTitle})
          </h4>
          <p className="text-xs font-semibold mt-0.5">
            {loading ? (
              <span className={isPending ? "text-gray-800" : "text-gray-500"}>
                Looking up check-ins...
              </span>
            ) : isPending ? (
              <span className="font-extrabold text-[#7c0000]">
                📢 You have {totalPending} pending milestone{totalPending > 1 ? "s" : ""}
              </span>
            ) : hasActiveCheckins ? (
              <span className="text-emerald-700 font-bold">✓ All caught up! No pending check-ins</span>
            ) : (
              <span className="text-gray-500">No active check-ins configured</span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate("/checkins")}
        className={`px-4 py-2 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer border-none ${
          isPending
            ? "bg-black text-white hover:bg-gray-800"
            : "bg-yellow-400 text-black hover:bg-yellow-500"
        }`}
      >
        Open
      </button>
    </div>
  );
}
