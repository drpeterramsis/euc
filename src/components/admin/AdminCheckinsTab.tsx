import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { showToast } from "../Toast";
import { apiUrl } from "../../utils/api";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface AdminCategory {
  id: string;
  tripId?: string;
  emoji: string;
  title: string;
  details: string;
  active?: boolean;
  createdAt: number;
}

interface AdminCheckinItem {
  id: string;
  tripId?: string;
  categoryId: string;
  title: string;
  description: string;
  buttonTitle: string;
  rolesAllowed: string[];
  active?: boolean;
}

interface AdminCategoryWithCheckins extends AdminCategory {
  checkins: AdminCheckinItem[];
  pendingCount?: number;
}

interface TripItem {
  id: string;
  title: string;
  active: boolean;
  createdAt?: number;
}

export default function AdminCheckinsTab() {
  const { currentUser } = useApp();

  // Trips List & Active trip states
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    return localStorage.getItem("selected_trip_id") || "departure";
  });

  // Flat categories scoped to currently selected trip
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Grouped active/inactive checkins hierarchy scoped to selected trip
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

  // Form states - Trip Management Overlays
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [newTripId, setNewTripId] = useState("");
  const [newTripTitle, setNewTripTitle] = useState("");
  const [submittingTrip, setSubmittingTrip] = useState(false);

  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [editingTripTitle, setEditingTripTitle] = useState("");
  const [editingTripActive, setEditingTripActive] = useState(true);
  const [savingTrip, setSavingTrip] = useState(false);

  const [isDeletingTrip, setIsDeletingTrip] = useState(false);
  const [deleteTripCascade, setDeleteTripCascade] = useState(true);
  const [deletingTrip, setDeletingTrip] = useState(false);

  const [isResettingTrip, setIsResettingTrip] = useState(false);
  const [resettingTrip, setResettingTrip] = useState(false);

  // Status Modal/Detail state
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
  const [selectedStatusTitle, setSelectedStatusTitle] = useState("");
  const [statusResult, setStatusResult] = useState<{ count: number; usernames: string[] } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Category Edit State
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState("");
  const [editingCatEmoji, setEditingCatEmoji] = useState("");
  const [editingCatTitle, setEditingCatTitle] = useState("");
  const [editingCatDetails, setEditingCatDetails] = useState("");
  const [editingCatActive, setEditingCatActive] = useState(true);
  const [savingCat, setSavingCat] = useState(false);

  // Check-in Edit State
  const [isEditingCheckin, setIsEditingCheckin] = useState(false);
  const [editingCheckinId, setEditingCheckinId] = useState("");
  const [editingCheckinTitle, setEditingCheckinTitle] = useState("");
  const [editingCheckinDesc, setEditingCheckinDesc] = useState("");
  const [editingCheckinBtn, setEditingCheckinBtn] = useState("");
  const [editingCheckinRoles, setEditingCheckinRoles] = useState<string[]>([]);
  const [editingCheckinActive, setEditingCheckinActive] = useState(true);
  const [savingCheckin, setSavingCheckin] = useState(false);

  // Delete Check-in State
  const [isDeletingCheckin, setIsDeletingCheckin] = useState(false);
  const [deletingCheckinId, setDeletingCheckinId] = useState("");
  const [deletingCheckinTitle, setDeletingCheckinTitle] = useState("");
  const [deletingCheckin, setDeletingCheckin] = useState(false);

  // Default system roles
  const availableRoles = ["admin", "super_user", "attendee", "doctor", "staff"];

  // Fetch all trip segments
  const fetchTripsList = async () => {
    try {
      const res = await fetch(apiUrl("trips/list"));
      if (res.ok) {
        const data = await res.json();
        const list = data.trips || [];
        setTrips(list);
        if (list.length > 0) {
          const exists = list.some((t: any) => t.id === selectedTripId);
          if (!exists) {
            setSelectedTripId(list[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Error loading trips", e);
      showToast("Error loading trip segments", "error");
    }
  };

  // Fetch flat categories list for creation mapper (scoped to selected trip)
  const fetchCategoriesList = async () => {
    if (!selectedTripId) return;
    setLoadingCats(true);
    try {
      const res = await fetch(
        apiUrl("checkins", {
          action: "categories.list",
          tripId: selectedTripId,
          includeInactive: "true",
        })
      );
      if (res.ok) {
        const data = await res.json();
        const cats = data.categories || [];
        setCategories(cats);
        // Default select to first category
        if (cats.length > 0) {
          setSelectedCatId(cats[0].id);
        } else {
          setSelectedCatId("");
        }
      }
    } catch (e) {
      console.error("Error loading flat categories", e);
      showToast("Error loading categories", "error");
    } finally {
      setLoadingCats(false);
    }
  };

  // Fetch full category-to-checkins hierarchy (scoped to selected trip)
  const fetchGroupedStatus = async () => {
    if (!selectedTripId) return;
    setLoadingGrouped(true);
    try {
      const res = await fetch(
        apiUrl("checkins", {
          action: "activeByTrip",
          tripId: selectedTripId,
          role: "admin",
          username: "admin",
        })
      );
      if (res.ok) {
        const data = await res.json();
        setGroupedCategories(data.categories || []);
      }
    } catch (e) {
      console.error("Error loading checkpoints hierarchy", e);
      showToast("Failed loading status dashboard", "error");
    } finally {
      setLoadingGrouped(false);
    }
  };

  // Fetch startup lists
  useEffect(() => {
    fetchTripsList();
  }, []);

  // Sync category maps whenever trip changes
  useEffect(() => {
    if (selectedTripId) {
      fetchCategoriesList();
      fetchGroupedStatus();
      setSelectedStatusId(null);
    }
  }, [selectedTripId]);

  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTripId(val);
    localStorage.setItem("selected_trip_id", val);
  };

  const handleRoleToggle = (role: string) => {
    if (rolesSelected.includes(role)) {
      setRolesSelected(rolesSelected.filter((r) => r !== role));
    } else {
      setRolesSelected([...rolesSelected, role]);
    }
  };

  // 1) TRIP CRUD - Create New Trip
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripId.trim()) {
      showToast("Trip ID code slug is required.", "error");
      return;
    }
    if (!newTripTitle.trim()) {
      showToast("Trip title is required.", "error");
      return;
    }

    setSubmittingTrip(true);
    try {
      const res = await fetch(apiUrl("trips"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          role: "admin",
          tripId: newTripId.trim(),
          title: newTripTitle.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast("✨ Trip segment created successfully", "success");
        setNewTripId("");
        setNewTripTitle("");
        setIsCreatingTrip(false);
        setSelectedTripId(data.id);
        localStorage.setItem("selected_trip_id", data.id);
        await fetchTripsList();
      } else {
        const err = await res.json();
        showToast(err.error || "Conflict: Trip already exists.", "error");
      }
    } catch (err: any) {
      showToast(`Network Error: ${err.message}`, "error");
    } finally {
      setSubmittingTrip(false);
    }
  };

  // 1b) TRIP CRUD - Update Trip
  const openEditTripDialog = () => {
    const activeTrip = trips.find(t => t.id === selectedTripId);
    if (!activeTrip) return;
    setEditingTripTitle(activeTrip.title);
    setEditingTripActive(activeTrip.active);
    setIsEditingTrip(true);
  };

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTripTitle.trim()) {
      showToast("Trip title is required.", "error");
      return;
    }

    setSavingTrip(true);
    try {
      const res = await fetch(apiUrl("trips"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          role: "admin",
          tripId: selectedTripId,
          patch: {
            title: editingTripTitle.trim(),
            active: editingTripActive
          }
        })
      });

      if (res.ok) {
        showToast("Trip details updated! 🗺️", "success");
        setIsEditingTrip(false);
        await fetchTripsList();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed updating trip metrics.", "error");
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, "error");
    } finally {
      setSavingTrip(false);
    }
  };

  // 1c) TRIP CRUD - Reset Trip Responses
  const handleResetTripResponses = async () => {
    setResettingTrip(true);
    try {
      const res = await fetch(apiUrl("trips"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          role: "admin",
          tripId: selectedTripId
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Wiped all participants status mappings (${data.cleared} responses clear)! 🔄`, "success");
        setIsResettingTrip(false);
        await fetchGroupedStatus();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed resetting trip.", "error");
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, "error");
    } finally {
      setResettingTrip(false);
    }
  };

  // 1d) TRIP CRUD - Delete Trip Entirely
  const handleDeleteTripEntirely = async () => {
    setDeletingTrip(true);
    try {
      const res = await fetch(apiUrl("trips"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          role: "admin",
          tripId: selectedTripId,
          cascade: deleteTripCascade
        })
      });

      if (res.ok) {
        showToast("Trip segment deleted successfully 🗑️", "success");
        setIsDeletingTrip(false);
        
        // Find default/first remaining trip
        const listRes = await fetch(apiUrl("trips", { action: "list" }));
        const listData = await listRes.json();
        const list = listData.trips || [];
        setTrips(list);
        
        if (list.length > 0) {
          setSelectedTripId(list[0].id);
          localStorage.setItem("selected_trip_id", list[0].id);
        } else {
          setSelectedTripId("departure");
          localStorage.setItem("selected_trip_id", "departure");
        }
      } else {
        const err = await res.json();
        showToast(err.error || "Failed deleting trip.", "error");
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, "error");
    } finally {
      setDeletingTrip(false);
    }
  };

  // 2) CATEGORY CRUD - Create
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) {
      showToast("Cannot create category: Trip is not selected.", "error");
      return;
    }
    if (!catTitle.trim()) {
      showToast("Category title is required.", "error");
      return;
    }

    setSubmittingCat(true);
    try {
      const res = await fetch(apiUrl("checkins"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "categories.create",
          role: "admin",
          tripId: selectedTripId,
          emoji: catEmoji.trim(),
          title: catTitle.trim(),
          details: catDetails.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(`Error: ${errData.error || "Failed to create category."}`, "error");
      } else {
        showToast("✨ Category created successfully!", "success");
        setCatTitle("");
        setCatDetails("");
        await fetchCategoriesList();
        await fetchGroupedStatus();
      }
    } catch (err: any) {
      showToast(`Network Error: ${err.message}`, "error");
    } finally {
      setSubmittingCat(false);
    }
  };

  // 2b) CATEGORY CRUD - Update
  const openEditCategory = (cat: AdminCategory) => {
    setEditingCatId(cat.id);
    setEditingCatEmoji(cat.emoji || "");
    setEditingCatTitle(cat.title || "");
    setEditingCatDetails(cat.details || "");
    setEditingCatActive(cat.active !== false);
    setIsEditingCat(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatTitle.trim()) {
      showToast("Category title is required.", "error");
      return;
    }

    setSavingCat(true);
    try {
      const res = await fetch(apiUrl("checkins"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "categories.update",
          role: "admin",
          catId: editingCatId,
          patch: {
            emoji: editingCatEmoji.trim(),
            title: editingCatTitle.trim(),
            details: editingCatDetails.trim(),
            active: editingCatActive
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || "Failed to update category.", "error");
      } else {
        showToast("Category updated successfully! ✨", "success");
        setIsEditingCat(false);
        await fetchCategoriesList();
        await fetchGroupedStatus();
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, "error");
    } finally {
      setSavingCat(false);
    }
  };

  // 3) CHECK-INS CRUD - Create
  const handleCreateCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) {
      showToast("Trip not selected.", "error");
      return;
    }
    if (!selectedCatId) {
      showToast("Please select or create building Category first.", "error");
      return;
    }
    if (!checkinTitle.trim()) {
      showToast("Please provide milestone step title.", "error");
      return;
    }
    if (!checkinBtn.trim()) {
      showToast("Please provide button action label.", "error");
      return;
    }
    if (rolesSelected.length === 0) {
      showToast("Please select at least one role.", "error");
      return;
    }

    setSubmittingCheckin(true);
    try {
      const res = await fetch(apiUrl("checkins"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "checkins.create",
          role: "admin",
          tripId: selectedTripId,
          categoryId: selectedCatId,
          title: checkinTitle.trim(),
          description: checkinDesc.trim(),
          buttonTitle: checkinBtn.trim(),
          rolesAllowed: rolesSelected,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(`Error: ${errData.error || "Failed to create check-in."}`, "error");
      } else {
        showToast("✨ Milestone step created successfully!", "success");
        setCheckinTitle("");
        setCheckinDesc("");
        setCheckinBtn("I arrived 📍");
        await fetchGroupedStatus();
      }
    } catch (err: any) {
      showToast(`Network Error: ${err.message}`, "error");
    } finally {
      setSubmittingCheckin(false);
    }
  };

  // 3b) CHECK-INS CRUD - Update
  const openEditCheckin = (item: AdminCheckinItem) => {
    setEditingCheckinId(item.id);
    setEditingCheckinTitle(item.title || "");
    setEditingCheckinDesc(item.description || "");
    setEditingCheckinBtn(item.buttonTitle || "");
    setEditingCheckinRoles(item.rolesAllowed || []);
    setEditingCheckinActive(item.active !== false);
    setIsEditingCheckin(true);
  };

  const handleRoleToggleEditing = (role: string) => {
    if (editingCheckinRoles.includes(role)) {
      setEditingCheckinRoles(editingCheckinRoles.filter((r) => r !== role));
    } else {
      setEditingCheckinRoles([...editingCheckinRoles, role]);
    }
  };

  const handleUpdateCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCheckinTitle.trim()) {
      showToast("Check-in title must be provided.", "error");
      return;
    }
    if (!editingCheckinBtn.trim()) {
      showToast("Button tag must be provided.", "error");
      return;
    }
    if (editingCheckinRoles.length === 0) {
      showToast("Please select at least one role.", "error");
      return;
    }

    setSavingCheckin(true);
    try {
      const res = await fetch(apiUrl("checkins"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkins.update",
          role: "admin",
          checkinId: editingCheckinId,
          patch: {
            title: editingCheckinTitle.trim(),
            description: editingCheckinDesc.trim(),
            buttonTitle: editingCheckinBtn.trim(),
            rolesAllowed: editingCheckinRoles,
            active: editingCheckinActive
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || "Failed to update check-in.", "error");
      } else {
        showToast("Checkpoint saved updated! ✨", "success");
        setIsEditingCheckin(false);
        await fetchGroupedStatus();
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, "error");
    } finally {
      setSavingCheckin(false);
    }
  };

  // 3c) CHECK-INS CRUD - Delete
  const openDeleteCheckin = (item: AdminCheckinItem) => {
    setDeletingCheckinId(item.id);
    setDeletingCheckinTitle(item.title || "");
    setIsDeletingCheckin(true);
  };

  const handleDeleteCheckin = async () => {
    setDeletingCheckin(true);
    try {
      const res = await fetch(apiUrl("checkins"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkins.delete",
          role: "admin",
          checkinId: deletingCheckinId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || "Failed to delete check-in.", "error");
      } else {
        showToast("Milestone check-in deleted! 🗑️", "success");
        setIsDeletingCheckin(false);
        if (selectedStatusId === deletingCheckinId) {
          setSelectedStatusId(null);
        }
        await fetchGroupedStatus();
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, "error");
    } finally {
      setDeletingCheckin(false);
    }
  };

  // 4) VIEW PARTICIPANT RESPONSE STATUS
  const handleCheckStatus = async (checkinId: string, titleText: string) => {
    setSelectedStatusId(checkinId);
    setSelectedStatusTitle(titleText);
    setStatusResult(null);
    setStatusLoading(true);

    try {
      const res = await fetch(
        apiUrl("checkins", {
          action: "status",
          checkinId,
          role: "admin",
        })
      );
      if (res.ok) {
        const data = await res.json();
        setStatusResult(data);
      } else {
        const errData = await res.json();
        showToast(`Failed loading metrics: ${errData.error || "Access Denied"}`, "error");
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setStatusLoading(false);
    }
  };

  const currentTripSegment = trips.find(t => t.id === selectedTripId);

  return (
    <div className="space-y-10 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm font-sans text-gray-900 relative">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <h2 className="text-xl font-black mb-1 flex items-center gap-2 text-gray-950">
            <span>💼</span> Travel Milestones Control Panel
          </h2>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            Provision trips, configure scoped timeline categories/check-ins, and inspect live participant completions.
          </p>
        </div>
      </div>

      {/* TRIP METRIC CONTROLS SECTION */}
      <div className="bg-zinc-950 p-5 rounded-2xl text-white border border-zinc-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-yellow-400 font-black">Active Itinerary Segment</p>
            <h3 className="text-base font-extrabold text-zinc-100">
               {currentTripSegment ? currentTripSegment.title : "Checking active trip..."}
            </h3>
            <p className="text-[11px] text-zinc-450 font-medium">
               Select or provision multiple conferences or segments. All categories and checkpoints below scope automatically.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTripId}
              onChange={handleTripChange}
              className="px-3 py-2 bg-zinc-900 border border-zinc-700/60 rounded-xl text-xs font-bold text-zinc-200 outline-none cursor-pointer focus:border-yellow-400"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} {!t.active ? "(Inactive)" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsCreatingTrip(true)}
              type="button"
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none"
            >
              ＋ New Trip
            </button>
            <button
              onClick={openEditTripDialog}
              type="button"
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none"
            >
              ✏️ Edit Segment
            </button>
            <button
              onClick={() => setIsResettingTrip(true)}
              type="button"
              className="bg-zinc-800 hover:bg-amber-950/40 text-amber-500 border border-amber-950/80 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              🔄 Reset responses
            </button>
            <button
              onClick={() => setIsDeletingTrip(true)}
              type="button"
              className="bg-zinc-800 hover:bg-red-950/40 text-red-500 border border-red-950/80 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
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
                  ⚠️ No categories created yet for selected trip. Create one above first!
                </div>
              ) : (
                <select
                  className="w-full border border-gray-200 p-2 rounded-lg outline-none font-bold text-gray-950 bg-white"
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji || "📍"} {cat.title} {!cat.active ? "(Inactive)" : ""}
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
              disabled={submittingCheckin || !selectedCatId}
              className="w-full bg-black text-white py-2.5 rounded-lg font-black text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-250 cursor-pointer border-none"
            >
              {submittingCheckin ? "Publishing Milestone..." : "✨ Publish step check-in"}
            </button>
          </form>

        </div>

        {/* Flat list or hierarchy of categories/checkins */}
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-gray-150 pb-2">
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest flex items-center gap-2">
              <span>📋</span> Scoped Segment Milestones
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
            <div className="p-12 text-center text-gray-400 font-bold border-2 border-dashed rounded-xl border-gray-200 text-xs">
              No categories mapped to selected trip segment. Add a category above.
            </div>
          ) : (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
              {groupedCategories.map((cat) => (
                <div key={cat.id} className="border border-gray-150 rounded-xl bg-gray-50 overflow-hidden">
                  
                  {/* Category Header Bar */}
                  <div className={`p-3.5 border-b border-gray-150 flex items-center justify-between ${cat.active !== false ? 'bg-gray-100' : 'bg-gray-200 opacity-75'}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-extrabold text-xs text-gray-950 flex items-center gap-1.5">
                        <span className="text-base">{cat.emoji || "📁"}</span>
                        {cat.title}
                      </p>
                      {cat.active === false && (
                        <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded border border-red-200 animate-pulse">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditCategory(cat)}
                        type="button"
                        className="text-[10px] bg-white hover:bg-gray-150 px-2.5 py-1 rounded border border-gray-200 font-extrabold transition-all text-gray-800 cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <span className="text-[9px] bg-gray-200 text-gray-600 font-black px-1.5 py-0.5 rounded">
                        ID: {cat.id ? cat.id.slice(0, 8) : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Category Child Check-ins */}
                  {(!cat.checkins || cat.checkins.length === 0) ? (
                    <p className="p-4 text-xs italic text-gray-400 font-medium font-sans">No milestone items inside this category yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-150">
                      {cat.checkins.map((item) => (
                        <div key={item.id} className={`p-3 flex items-center justify-between gap-3 hover:bg-yellow-55/20 transition-colors ${item.active !== false ? 'bg-white' : 'bg-zinc-100 opacity-80'}`}>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-xs text-gray-950">{item.title}</p>
                              {item.active === false && (
                                <span className="text-[8px] bg-zinc-200 text-zinc-600 font-black px-1.5 py-0.5 rounded border border-zinc-300">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                              Btn: "{item.buttonTitle}" · Allowed: {item.rolesAllowed.join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCheckStatus(item.id, item.title)}
                              type="button"
                              className="bg-gray-950 hover:bg-black text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer border-none shadow-none"
                            >
                              📊 Status
                            </button>
                            <button
                              onClick={() => openEditCheckin(item)}
                              type="button"
                              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => openDeleteCheckin(item)}
                              type="button"
                              className="bg-white hover:bg-red-50 text-red-650 border border-red-200 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          </div>
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
                <div className="flex items-center gap-2 justify-center py-4 text-xs font-bold font-mono">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <p>Requesting KV respond status...</p>
                </div>
              )}

              {statusResult && (
                <div className="space-y-3 font-sans text-xs">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <p className="font-bold text-gray-300">Total Checked-In Count:</p>
                    <span className="bg-yellow-400 text-black font-black px-2.5 py-0.5 rounded text-xs">
                      {statusResult.count} participants
                    </span>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-2">
                      Responded Usernes:
                    </p>
                    {statusResult.usernames.length === 0 ? (
                      <p className="italic text-gray-400 bg-gray-900/45 p-3 rounded">No responses recorded yet.</p>
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

      {/* TRIP CRUD: 1) CREATE TRIP MODAL */}
      {isCreatingTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-gray-950 flex items-center gap-2 mb-4 border-b border-gray-150 pb-2">
              ➕ Provision New Trip Segment
            </h3>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Trip ID Slug (letters/numbers/dash/underscore)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. arrival-route"
                  value={newTripId}
                  onChange={(e) => setNewTripId(e.target.value)}
                  className="w-full border border-gray-200 p-2 rounded-lg font-bold text-gray-950 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Trip Segment Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight 2: Return Trip / Airport Counter"
                  value={newTripTitle}
                  onChange={(e) => setNewTripTitle(e.target.value)}
                  className="w-full border border-gray-200 p-2 rounded-lg font-bold text-gray-950 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTrip(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTrip}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-black text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  {submittingTrip ? "Creating..." : "Save Segment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRIP CRUD: 2) EDIT Current TRIP MODAL */}
      {isEditingTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-gray-950 flex items-center gap-2 mb-4 border-b border-gray-150 pb-2">
              ✏️ Options: Edit Trip Segment
            </h3>
            <form onSubmit={handleUpdateTrip} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Trip Segment Name
                </label>
                <input
                  type="text"
                  required
                  value={editingTripTitle}
                  onChange={(e) => setEditingTripTitle(e.target.value)}
                  className="w-full border border-gray-200 p-2 rounded-lg font-bold text-gray-950 bg-white shadow-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>

              <div className="flex items-center gap-3 py-2 border-t border-b border-gray-100">
                <input
                  type="checkbox"
                  id="tripActive"
                  checked={editingTripActive}
                  onChange={(e) => setEditingTripActive(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400 accent-yellow-400 cursor-pointer"
                />
                <label htmlFor="tripActive" className="text-xs font-black text-gray-700 select-none cursor-pointer">
                  Trip Segment is Active (Visible to travel and flight checklists)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingTrip(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTrip}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-black text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  {savingTrip ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRIP CRUD: 3) RESET TRIP RESPONSES MODAL */}
      {isResettingTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-amber-600 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
              🔄 Confirm Wipe Responses
            </h3>
            <p className="text-xs text-gray-650 leading-relaxed font-semibold mb-4">
              Are you absolutely sure you want to clear <strong className="text-gray-900 font-extrabold">all checkpoint completions</strong> for trip <strong className="text-gray-950 font-black">"{currentTripSegment?.title}"</strong>? This will reset all participant badges to "unchecked" but will NOT delete categories/milestones.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResettingTrip(false)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                No, Cancel
              </button>
              <button
                type="button"
                disabled={resettingTrip}
                onClick={handleResetTripResponses}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-black text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                {resettingTrip ? "Resetting..." : "Wipe Statuses"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRIP CRUD: 4) DELETE TRIP CONFIRMATION MODAL */}
      {isDeletingTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-red-600 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
              ⚠️ Delete Trip Segment?
            </h3>
            <p className="text-xs text-gray-650 leading-relaxed font-semibold mb-3">
              Are you sure you want to delete <strong className="text-gray-950 font-black">"{currentTripSegment?.title}"</strong>?
            </p>

            <div className="flex items-center gap-3 py-2 bg-red-50 p-3 rounded-lg border border-red-200 mb-4">
              <input
                type="checkbox"
                id="deleteCascade"
                checked={deleteTripCascade}
                onChange={(e) => setDeleteTripCascade(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 accent-red-650 cursor-pointer"
              />
              <label htmlFor="deleteCascade" className="text-[11px] font-black text-red-950 select-none cursor-pointer">
                Cascade delete all child categories and checklists (Recommended)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeletingTrip(false)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                No, Keep Trip
              </button>
              <button
                type="button"
                disabled={deletingTrip}
                onClick={handleDeleteTripEntirely}
                className="px-3.5 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg font-black text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                {deletingTrip ? "Destroying..." : "Yes, Purge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY EDIT MODAL */}
      {isEditingCat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-gray-950 flex items-center gap-2 mb-4 border-b border-gray-150 pb-2">
              ✏️ Options: Edit Category
            </h3>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={editingCatEmoji}
                    onChange={(e) => setEditingCatEmoji(e.target.value)}
                    className="w-full border border-gray-200 p-2 rounded-lg text-center font-bold text-gray-955 bg-white focus:ring-1 focus:ring-yellow-400 outline-none"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Category Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCatTitle}
                    onChange={(e) => setEditingCatTitle(e.target.value)}
                    className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-bold text-gray-950 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Instruction Details (Optional)
                </label>
                <textarea
                  value={editingCatDetails}
                  onChange={(e) => setEditingCatDetails(e.target.value)}
                  className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-semibold text-xs text-gray-950 bg-white h-20 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 py-2 border-t border-b border-gray-100">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={editingCatActive}
                  onChange={(e) => setEditingCatActive(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400 accent-yellow-450 cursor-pointer"
                />
                <label htmlFor="catActive" className="text-xs font-black text-gray-75 select-none cursor-pointer">
                  Category is Active (Visible to participants)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCat(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-black text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  {savingCat ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK-IN EDIT MODAL */}
      {isEditingCheckin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-gray-950 flex items-center gap-2 mb-4 border-b border-gray-150 pb-2">
              ✏️ Options: Edit Milestone Step
            </h3>
            <form onSubmit={handleUpdateCheckin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Milestone Title
                </label>
                <input
                  type="text"
                  required
                  value={editingCheckinTitle}
                  onChange={(e) => setEditingCheckinTitle(e.target.value)}
                  className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-bold text-gray-950 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Sub-description (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingCheckinDesc}
                    onChange={(e) => setEditingCheckinDesc(e.target.value)}
                    className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-semibold text-xs text-gray-950 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Button Action Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCheckinBtn}
                    onChange={(e) => setEditingCheckinBtn(e.target.value)}
                    className="w-full border border-gray-200 p-2 rounded-lg outline-none focus:border-yellow-500 font-bold text-xs text-gray-950 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Target Allowed Roles
                </label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {availableRoles.map((role) => {
                    const checked = editingCheckinRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleToggleEditing(role)}
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

              <div className="flex items-center gap-3 py-2 border-t border-b border-gray-100">
                <input
                  type="checkbox"
                  id="chkActive"
                  checked={editingCheckinActive}
                  onChange={(e) => setEditingCheckinActive(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400 accent-yellow-400 cursor-pointer"
                />
                <label htmlFor="chkActive" className="text-xs font-black text-gray-755 select-none cursor-pointer">
                  Check-in is Active (Visible to allowed participants)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCheckin(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCheckin}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-black text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  {savingCheckin ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETETE CHECKIN MODAL */}
      {isDeletingCheckin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl border border-gray-150 p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-red-650 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
              ⚠️ Confirm Delete Check-in
            </h3>
            <p className="text-xs text-gray-650 leading-relaxed font-semibold mb-4">
              Are you absolutely sure you want to delete <strong className="text-gray-950 font-black">"{deletingCheckinTitle}"</strong>? All participant respond logs will be wiped. This action is permanent and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeletingCheckin(false)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                No, Keep It
              </button>
              <button
                type="button"
                disabled={deletingCheckin}
                onClick={handleDeleteCheckin}
                className="px-3.5 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg font-black text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                {deletingCheckin ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
