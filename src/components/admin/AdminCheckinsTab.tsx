import React, { useState, useEffect } from "react";

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

export default function AdminCheckinsTab() {
  const [adminKey, setAdminKey] = useState(() => {
    return localStorage.getItem("admin_api_key") || "";
  });

  const [title, setTitle] = useState("");
  const [rolesSelected, setRolesSelected] = useState<string[]>(["attendee", "doctor"]);
  const [trip, setTrip] = useState("departure");
  const [loading, setLoading] = useState(false);
  const [checkinsList, setCheckinsList] = useState<Checkin[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<{ count: number; usernames: string[] } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Available selectable roles
  const availableRoles = ["admin", "super_user", "attendee", "doctor", "staff"];

  const handleSaveAdminKey = (val: string) => {
    setAdminKey(val);
    localStorage.setItem("admin_api_key", val);
  };

  // Fetch check-ins list for admins (we can use the active endpoint for "admin" role)
  const fetchCheckins = async () => {
    try {
      const res = await fetch(`/api/checkins/active?role=admin&trip=departure`);
      if (res.ok) {
        const data = await res.json();
        setCheckinsList(data.checkins || []);
      }
    } catch (e) {
      console.error("Error loading check-ins list", e);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, []);

  const handleRoleToggle = (role: string) => {
    if (rolesSelected.includes(role)) {
      setRolesSelected(rolesSelected.filter((r) => r !== role));
    } else {
      setRolesSelected([...rolesSelected, role]);
    }
  };

  const handleCreateCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please provide a check-in title.");
      return;
    }
    if (rolesSelected.length === 0) {
      alert("Please select at least one role.");
      return;
    }
    if (!adminKey.trim()) {
      alert("Please enter the Admin Key first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkins/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey.trim(),
        },
        body: JSON.stringify({
          title: title.trim(),
          rolesAllowed: rolesSelected,
          trip,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to create check-in"}`);
      } else {
        const data = await res.json();
        alert(`Successfully created check-in: ID ${data.id}`);
        setTitle("");
        fetchCheckins();
      }
    } catch (err: any) {
      alert(`Network/Server Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (checkinId: string) => {
    setSelectedStatusId(checkinId);
    setStatusResult(null);
    setStatusLoading(true);

    if (!adminKey.trim()) {
      alert("Please enter the Admin Key first to query respondents.");
      setStatusLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/checkins/status?checkinId=${checkinId}`, {
        headers: {
          "x-admin-key": adminKey.trim(),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStatusResult(data);
      } else {
        const errData = await res.json();
        alert(`Failed to fetch status: ${errData.error || "Unauthorized"}`);
      }
    } catch (err: any) {
      alert(`Error fetching status: ${err.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm font-sans text-gray-900">
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-gray-950">
          <span>✅</span> Departure Check-ins Management
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          Create custom check-ins for the departure trip (e.g., "Arrived at Cairo Airport" or "Boarded Flight") and configure visible roles.
        </p>
      </div>

      {/* Admin Credentials Setup */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
        <label className="block text-xs font-black text-yellow-800 uppercase tracking-wider">
          🔑 Admin Protection Key (Matches ADMIN_KEY Env Var)
        </label>
        <p className="text-xs text-yellow-700 font-medium mb-1">
          Required to authorize create and status lookups securely. Saved locally.
        </p>
        <input
          type="password"
          placeholder="Enter Admin Key"
          className="w-full sm:max-w-md border border-yellow-300 p-2.5 rounded-lg font-bold text-gray-950 bg-white outline-none focus:ring-2 focus:ring-yellow-400"
          value={adminKey}
          onChange={(e) => handleSaveAdminKey(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Check-in Form */}
        <form onSubmit={handleCreateCheckin} className="space-y-5 border border-gray-200 p-5 rounded-xl">
          <h3 className="text-md font-extrabold text-gray-950 uppercase tracking-wide border-b border-gray-100 pb-2">
            Create Check-in
          </h3>

          <div className="space-y-1">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
              Check-in Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Arrived at Cairo airport Terminal 2"
              className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:border-yellow-500 font-bold text-gray-950 bg-gray-50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
              Allowed Roles (Check all that apply)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {availableRoles.map((role) => {
                const checked = rolesSelected.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      checked
                        ? "bg-yellow-400 text-black border-yellow-500 font-black shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {role} {checked ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
              Trip Identifier
            </label>
            <select
              className="w-full border border-gray-200 p-2.5 rounded-lg outline-none font-bold text-gray-950 bg-gray-50"
              value={trip}
              onChange={(e) => setTrip(e.target.value)}
            >
              <option value="departure">Departure</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-400 cursor-pointer"
          >
            {loading ? "Creating..." : "✨ Publish Check-In"}
          </button>
        </form>

        {/* Existing Check-ins Panel */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="text-md font-extrabold text-gray-950 uppercase tracking-wide">
              Active Check-ins List
            </h3>
            <button
              onClick={fetchCheckins}
              type="button"
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded font-bold transition-all text-gray-600 cursor-pointer"
            >
              🔄 Refresh
            </button>
          </div>

          {checkinsList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-bold font-sans border border-dashed rounded-xl border-gray-200">
              No check-ins created for departure yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {checkinsList.map((c) => (
                <div key={c.id} className="p-4 bg-gray-50 rounded-lg border border-gray-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-extrabold text-sm text-gray-950">{c.title}</p>
                    <p className="text-[10px] text-gray-500 font-semibold font-sans">
                      ID: {c.id} · Allowed: {c.rolesAllowed.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckStatus(c.id)}
                    type="button"
                    className="self-start sm:self-auto px-3.5 py-1.5 bg-gray-900 text-white rounded font-bold text-xs hover:bg-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    📊 Status
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Status Details / Respondents Panel */}
          {selectedStatusId && (
            <div className="p-4 bg-gray-900 text-white rounded-xl border border-gray-800 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs font-black tracking-widest uppercase text-yellow-400">
                  Respondent Status:
                </p>
                <button
                  onClick={() => setSelectedStatusId(null)}
                  type="button"
                  className="text-gray-400 hover:text-white font-bold text-sm"
                >
                  ✕ Close
                </button>
              </div>

              {statusLoading && (
                <div className="flex items-center gap-2 justify-center py-2 text-xs">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <p>Loading respondents list...</p>
                </div>
              )}

              {statusResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                    <p className="text-sm font-bold">Total Checked-In Count:</p>
                    <span className="bg-yellow-400 text-black font-black px-2 py-0.5 rounded text-xs">
                      {statusResult.count} participants
                    </span>
                  </div>

                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Responded Usernames:
                  </p>
                  {statusResult.usernames.length === 0 ? (
                    <p className="text-xs italic text-gray-400">No one checked in yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {statusResult.usernames.map((u) => (
                        <span key={u} className="px-2 py-0.5 bg-gray-800 text-white font-semibold text-xs rounded border border-gray-700">
                          👤 {u}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
