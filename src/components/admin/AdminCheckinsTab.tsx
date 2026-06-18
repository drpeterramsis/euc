import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface AdminCategory {
  id: string;
  emoji: string;
  title: string;
  details: string;
  createdAt: number;
}

interface AdminCheckinItem {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  buttonTitle: string;
  rolesAllowed: string[];
}

interface AdminCategoryWithCheckins extends AdminCategory {
  checkins: AdminCheckinItem[];
}

export default function AdminCheckinsTab() {
  const { currentUser } = useApp();

  // Categories list
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Grouped active checkins
  const [groupedCategories, setGroupedCategories] = useState<AdminCategoryWithCheckins[]>([]);
  const [loadingGrouped, setLoadingGrouped] = useState(false);

  // Form states - Create Category
  const [catEmoji, setCatEmoji] = useState("🛫");
  const [catTitle, setCatTitle] = useState("");
  const [catDetails, setCatDetails] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);

  // Form states - Create Check-In
  const [selectedCatId, setSelectedCatId] = useState("");
  const [checkinTitle, setCheckinTitle] = useState("");
  const [checkinDesc, setCheckinDesc] = useState("");
  const [checkinBtn, setCheckinBtn] = useState("I arrived 📍");
  const [rolesSelected, setRolesSelected] = useState<string[]>(["attendee", "doctor"]);
  const [submittingCheckin, setSubmittingCheckin] = useState(false);

  // Status Modal/Detail state
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
  const [selectedStatusTitle, setSelectedStatusTitle] = useState("");
  const [statusResult, setStatusResult] = useState<{ count: number; usernames: string[] } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Default system roles
  const availableRoles = ["admin", "super_user", "attendee", "doctor", "staff"];

  // Fetch standard flat categories for checking-in select box
  const fetchCategoriesList = async () => {
    setLoadingCats(true);
    try {
      const res = await fetch("/api/checkinCats/list?trip=departure");
      if (res.ok) {
        const data = await res.json();
        const cats = data.categories || [];
        setCategories(cats);
        if (cats.length > 0 && !selectedCatId) {
          setSelectedCatId(cats[0].id);
        }
      }
    } catch (e) {
      console.error("Error loading categories flat list", e);
    } finally {
      setLoadingCats(false);
    }
  };

  // Fetch overall hierarchy (active categories + internal checkins) via user query
  const fetchGroupedStatus = async () => {
    setLoadingGrouped(true);
    try {
      // Admin sees everyone and all allowed responses using the standard endpoint with role=admin
      const res = await fetch("/api/checkins/activeByTrip?trip=departure&role=admin&username=admin");
      if (res.ok) {
        const data = await res.json();
        setGroupedCategories(data.categories || []);
      }
    } catch (e) {
      console.error("Error loading grouped check-ins checklist", e);
    } finally {
      setLoadingGrouped(false);
    }
  };

  useEffect(() => {
    fetchCategoriesList();
    fetchGroupedStatus();
  }, []);

  const handleRoleToggle = (role: string) => {
    if (rolesSelected.includes(role)) {
      setRolesSelected(rolesSelected.filter((r) => r !== role));
    } else {
      setRolesSelected([...rolesSelected, role]);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catTitle.trim()) {
      alert("Category title is required.");
      return;
    }

    setSubmittingCat(true);
    try {
      const res = await fetch("/api/checkinCats/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emoji: catEmoji.trim(),
          title: catTitle.trim(),
          details: catDetails.trim(),
          role: "admin", // Enforced for administrative role verify
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to create category."}`);
      } else {
        const data = await res.json();
        alert("✨ Successfully created new Category!");
        setCatTitle("");
        setCatDetails("");
        // Reload categories & status
        await fetchCategoriesList();
        await fetchGroupedStatus();
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message}`);
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleCreateCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) {
      alert("Please select or create an active Category first.");
      return;
    }
    if (!checkinTitle.trim()) {
      alert("Please provide a check-in title.");
      return;
    }
    if (!checkinBtn.trim()) {
      alert("Please provide the button label.");
      return;
    }
    if (rolesSelected.length === 0) {
      alert("Please select at least one role.");
      return;
    }

    setSubmittingCheckin(true);
    try {
      const res = await fetch("/api/checkins/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: selectedCatId,
          title: checkinTitle.trim(),
          description: checkinDesc.trim(),
          buttonTitle: checkinBtn.trim(),
          rolesAllowed: rolesSelected,
          role: "admin", // Enforced for administrative role verify
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to create check-in."}`);
      } else {
        alert("✨ Check-in added to selected Category successfully!");
        setCheckinTitle("");
        setCheckinDesc("");
        setCheckinBtn("I arrived 📍");
        // Reload categories & status list
        await fetchGroupedStatus();
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message}`);
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const handleCheckStatus = async (checkinId: string, titleText: string) => {
    setSelectedStatusId(checkinId);
    setSelectedStatusTitle(titleText);
    setStatusResult(null);
    setStatusLoading(true);

    try {
      // Query check-in status (Admin/Staff privilege required)
      const res = await fetch(`/api/checkins/status?checkinId=${checkinId}&role=admin`);

      if (res.ok) {
        const data = await res.json();
        setStatusResult(data);
      } else {
        const errData = await res.json();
        alert(`Failed to fetch status respondents: ${errData.error || "Unauthorized"}`);
      }
    } catch (err: any) {
      alert(`Error fetching status: ${err.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-10 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm font-sans text-gray-900">
      <div>
        <h2 className="text-xl font-black mb-2 flex items-center gap-2 text-gray-950">
          <span>💼</span> Milestone Category & Check-in Control Panel
        </h2>
        <p className="text-sm text-gray-500 font-semibold leading-relaxed">
          Create custom categories, assign multiple user roles to check-ins, and inspect live respondent counts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Form Containers Column */}
        <div className="space-y-8">
          
          {/* Section 1: Create Category */}
          <form onSubmit={handleCreateCategory} className="space-y-4 border border-gray-150 p-5 rounded-xl bg-gray-50/50">
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest border-b border-gray-200 pb-2 flex items-center gap-1.5">
              <span>📂</span> Step 1: Create Category
            </h3>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Emoji
                </label>
                <input
                  type="text"
                  placeholder="🛫"
                  className="w-full border border-gray-200 p-2 rounded-lg text-center font-bold text-gray-950 bg-white"
                  value={catEmoji}
                  onChange={(e) => setCatEmoji(e.target.value)}
                />
              </div>

              <div className="col-span-3 space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Category Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight 1: Prague Airport (PRG)"
                  className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-bold text-gray-950 bg-white"
                  value={catTitle}
                  onChange={(e) => setCatTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Instruction Details (Optional)
              </label>
              <textarea
                placeholder="e.g. Key milestone checkpoints from counter registration to landing."
                className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-semibold text-xs text-gray-950 bg-white h-20 resize-none"
                value={catDetails}
                onChange={(e) => setCatDetails(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submittingCat}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-colors disabled:bg-gray-300 cursor-pointer border-none"
            >
              {submittingCat ? "Creating Category..." : "📂 Save Category"}
            </button>
          </form>

          {/* Section 2: Create Check-In */}
          <form onSubmit={handleCreateCheckin} className="space-y-4 border border-gray-150 p-5 rounded-xl bg-gray-50/50">
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest border-b border-gray-200 pb-2 flex items-center gap-1.5">
              <span>🔗</span> Step 2: Add Milestone Step
            </h3>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Target Category
              </label>
              {categories.length === 0 ? (
                <div className="text-xs text-red-650 font-bold bg-white p-2 rounded border border-red-200">
                  ⚠️ No categories created yet. Create one above!
                </div>
              ) : (
                <select
                  className="w-full border border-gray-200 p-2 rounded-lg outline-none font-bold text-gray-950 bg-white"
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji || "📍"} {cat.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Milestone Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Registered luggage at desk counter"
                className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-bold text-gray-950 bg-white"
                value={checkinTitle}
                onChange={(e) => setCheckinTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Sub-description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Report if bag is overweight"
                  className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-semibold text-xs text-gray-950 bg-white"
                  value={checkinDesc}
                  onChange={(e) => setCheckinDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Button Action Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luggage dropped!"
                  className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-bold text-xs text-gray-950 bg-white"
                  value={checkinBtn}
                  onChange={(e) => setCheckinBtn(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Target Allowed Roles (Multi-select)
              </label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {availableRoles.map((role) => {
                  const checked = rolesSelected.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                        checked
                          ? "bg-yellow-400 text-black border-yellow-500 font-black shadow-none"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {role} {checked ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingCheckin || categories.length === 0}
              className="w-full bg-black text-white py-2.5 rounded-lg font-black text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-300 cursor-pointer border-none"
            >
              {submittingCheckin ? "Publishing Milestone..." : "✨ Publish step check-in"}
            </button>
          </form>

        </div>

        {/* Existing Check-ins List & Category Hierarchy Panel */}
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-gray-150 pb-2">
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest flex items-center gap-2">
              <span>📋</span> Active Database Milestones
            </h3>
            <button
              onClick={fetchGroupedStatus}
              type="button"
              className="text-[10px] bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded font-black transition-all text-gray-600 cursor-pointer border-none uppercase tracking-wider"
            >
              🔄 Refresh List
            </button>
          </div>

          {loadingGrouped ? (
            <div className="flex items-center gap-2 justify-center py-12 text-xs font-semibold text-gray-450 uppercase tracking-wider">
               <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
               <span>Connecting Vercel KV...</span>
            </div>
          ) : groupedCategories.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold border-2 border-dashed rounded-xl border-gray-200 text-sm">
              No categories mapped yet. Add a category above.
            </div>
          ) : (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
              {groupedCategories.map((cat) => (
                <div key={cat.id} className="border border-gray-150 rounded-xl bg-gray-50 overflow-hidden">
                  {/* Category Header Bar */}
                  <div className="bg-gray-100 p-3.5 border-b border-gray-150 flex items-center justify-between">
                    <p className="font-extrabold text-xs text-gray-950 flex items-center gap-1.5">
                      <span className="text-base">{cat.emoji || "📁"}</span>
                      {cat.title}
                    </p>
                    <span className="text-[9px] bg-gray-200 text-gray-600 font-black px-1.5 py-0.5 rounded">
                      CAT ID: {cat.id ? cat.id.slice(0, 8) : "N/A"}
                    </span>
                  </div>

                  {/* Category Child Check-ins */}
                  {(!cat.checkins || cat.checkins.length === 0) ? (
                    <p className="p-4 text-xs italic text-gray-400 font-medium">No milestone items inside this category yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-150">
                      {cat.checkins.map((item) => (
                        <div key={item.id} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-yellow-50/20 transition-colors">
                          <div className="space-y-0.5">
                            <p className="font-bold text-xs text-gray-950">{item.title}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              Btn: "{item.buttonTitle}" · Allowed: {item.rolesAllowed.join(", ")}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCheckStatus(item.id, item.title)}
                            type="button"
                            className="bg-gray-950 hover:bg-black text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-none shadow-none"
                          >
                            📊 Status
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Respondent Details Segment */}
          {selectedStatusId && (
            <div className="p-5 bg-gray-950 text-white rounded-2xl border border-gray-800 space-y-4 shadow-xl transition-all">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-yellow-400">
                    Live Status Monitor:
                  </p>
                  <p className="text-xs font-bold text-gray-200 mt-1 line-clamp-1">
                    "{selectedStatusTitle}"
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStatusId(null)}
                  type="button"
                  className="text-gray-400 hover:text-white font-extrabold text-base bg-transparent border-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {statusLoading && (
                <div className="flex items-center gap-2 justify-center py-4 text-xs font-bold">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <p>Requesting KV respond status...</p>
                </div>
              )}

              {statusResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <p className="text-xs font-bold text-gray-300">Total Checked-In Count:</p>
                    <span className="bg-yellow-400 text-black font-black px-2.5 py-0.5 rounded text-xs">
                      {statusResult.count} participants
                    </span>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-2">
                      Responded Usernames:
                    </p>
                    {statusResult.usernames.length === 0 ? (
                      <p className="text-xs italic text-gray-400 bg-gray-900/45 p-3 rounded">No responses recorded yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                        {statusResult.usernames.map((u) => (
                          <span key={u} className="px-2.5 py-1 bg-gray-850 text-gray-200 font-bold text-xs rounded-lg border border-gray-800 flex items-center gap-1">
                            👤 {u}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
