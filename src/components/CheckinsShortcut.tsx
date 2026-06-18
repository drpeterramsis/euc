import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface CheckinsShortcutProps {
  user: any;
}

export default function CheckinsShortcut({ user }: CheckinsShortcutProps) {
  const navigate = useNavigate();
  const [activeCount, setActiveCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !user.role) return;

    setLoading(true);
    const roleQuery = encodeURIComponent(user.role.trim());

    fetch(`/api/checkins/active?role=${roleQuery}&trip=departure`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        setActiveCount(data.checkins?.length || 0);
      })
      .catch(() => {
        // Silently handle
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between font-sans">
      <div className="flex items-center gap-3">
        <div className="text-2xl">✈️</div>
        <div>
          <h4 className="font-extrabold text-[#9F5F00] text-sm uppercase tracking-wide">
            Check-ins (Departure)
          </h4>
          <p className="text-xs text-gray-600 font-semibold">
            {loading ? (
              <span>Looking up check-ins...</span>
            ) : activeCount > 0 ? (
              <span className="text-yellow-800 font-bold">
                📢 {activeCount} active check-in{activeCount > 1 ? "s" : ""} available
              </span>
            ) : (
              <span className="text-gray-550">No active check-ins right now</span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate("/checkins")}
        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer border-none"
      >
        Open
      </button>
    </div>
  );
}
