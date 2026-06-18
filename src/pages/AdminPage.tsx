/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, DragEvent, useRef } from "react";
import Layout from "../components/Layout";
import {
  useApp,
  DEFAULT_SCHEDULE_CATEGORIES,
  DEFAULT_MEDIA_CATEGORIES,
} from "../context/AppContext";
import { APP_VERSION } from "../version";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { writeJSON, readJSON } from "../utils/github";
import UserControlCard from "../components/UserControlCard";
import UserGridCard from "../components/UserGridCard";
import UserAvatar from "../components/UserAvatar";
import { callHref, whatsappHref, displayPhone } from "../utils/phone";
import MediaPostViewerModal from "../components/MediaPostViewerModal";
import MediaPostModal from "../components/MediaPostModal";
import { showToast } from "../components/Toast";
import { compressImage } from "../utils/image";
import AdminDashboard from "./AdminDashboard";
import AdminMessages from "./admin/AdminMessages";
import AdminGalleries from "./admin/AdminGalleries";
import SettingsTab from "../components/admin/SettingsTab";
import AdminCheckinsTab from "../components/admin/AdminCheckinsTab";
import { localToUtc, utcToDisplay, TZ_CAIRO, TZ_PRAGUE, utcToLocalInput, getUtcFromEvent, formatTimeAmPm } from "../utils/timezone";

interface AdminProps {
  initialTab?: string;
}

export default function Admin({ initialTab }: AdminProps = {}) {
  const {
    currentUser,
    users,
    schedule,
    sessions,
    settings,
    media = [],
    tripInfo,
    appConfig,
    updateUsers,
    updateSchedule,
    updateSessions,
    updateSettings,
    updateMedia,
    updateTripInfo,
    updateAppConfig,
  } = useApp();
  const [searchParams] = useSearchParams();
  const defaultTab = initialTab || searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    const saved = localStorage.getItem("adminUserViewMode");
    return saved === "grid" ? "grid" : "list";
  });
  const [roleFilter, setRoleFilter] = useState<string>(() => {
    return localStorage.getItem("adminRoleFilter") || "all";
  });

  const handleViewModeChange = (mode: "list" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("adminUserViewMode", mode);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    localStorage.setItem("adminRoleFilter", role);
  };

  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Data Control state
  const [selectedDataUser, setSelectedDataUser] = useState<any>(null);

  const [inputTimezone, setInputTimezone] = useState<string>("Africa/Cairo");

  // Tab 3 State (Schedule & Sessions)
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null,
  );
  const [applyToAllSchedule, setApplyToAllSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    id: "",
    date: "",
    time: "",
    endTime: "",
    category: "other",
    activity: "",
    location: "",
    link: "",
    mapLocation: "",
    notes: "",
    accessRoles: ["admin", "doctor", "staff"],
    accessUserIds: [] as string[],
  });

  // --- SMART COUNTDOWN STATE ---
  const [countdownConfig, setCountdownConfig] = useState<any>({
    customMessage: "",
    showTimeline: true,
    customTimelineEntries: [],
  });

  // --- FLIGHT & HOTEL STATE DIRECTLY FROM schedule.json ---
  const [flightHotelForm, setFlightHotelForm] = useState<any[]>([]);

  // --- TRIP SCHEDULE DAILY AGENDA STATE ---
  const [tripSchedule, setTripSchedule] = useState<any[]>([]);

  // Simple state for customized timeline entries add-form
  const [newTimelineEntry, setNewTimelineEntry] = useState({
    label: "",
    datetime: "",
    icon: "📌",
    color: "gray" as "yellow" | "green" | "blue" | "red" | "gray",
    inputTimezone: "Africa/Cairo",
    timezoneDisplay: "both" as "both" | "prague" | "cairo",
  });

  const [iconInput, setIconInput ] = useState<string>("📌");
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [sessionItems, setSessionItems] = useState<any[]>([]);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [scheduleSubTab, setScheduleSubTab] = useState<"schedule" | "sessions">("schedule");
  const [sessionForm, setSessionForm] = useState({
    id: "",
    title: "",
    speaker: "",
    speakerJob: "",
    date: "",
    time: "",
    toTime: "",
    hall: "",
    link: "",
    linkUrl: "",
    linkTitle: "",
    timezoneDisplay: "both" as "both" | "prague" | "cairo",
    speakerPhoto: "",
    speakerWhatsApp: "",
  });

  const [isSavingSession, setIsSavingSession] = useState(false);
  const [selectedSessionDay, setSelectedSessionDay] = useState<string>("");

  useEffect(() => {
    if (sessionItems.length > 0) {
      const uniqueDays = Array.from(new Set(sessionItems.map((s: any) => (s.date || "") as string)))
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare(b));
      
      if (uniqueDays.length > 0) {
        if (!selectedSessionDay || !uniqueDays.includes(selectedSessionDay)) {
          setSelectedSessionDay(uniqueDays[0]);
        }
      } else {
        setSelectedSessionDay("");
      }
    } else {
      setSelectedSessionDay("");
    }
  }, [sessionItems, selectedSessionDay]);

  // Tab 4 State (Features)
  const [featureSettings, setFeatureSettings] = useState<any>({});
  const [applyFeaturesToAllUsers, setApplyFeaturesToAllUsers] = useState(false);
  const [selectedFeatureUser, setSelectedFeatureUser] = useState<string>("");
  const [userFeatureAccess, setUserFeatureAccess] = useState<any>({});
  const [userVisibleFields, setUserVisibleFields] = useState<any>({});
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);

  // Tab 5 State (Media)
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [roleGlobalConfig, setRoleGlobalConfig] = useState({
    role: "doctor",
    feature: "schedule",
    status: "active",
  });
  const [editingMediaPost, setEditingMediaPost] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // Tab 6 State (Categories)
  const [newSchedCat, setNewSchedCat] = useState("");
  const [newMediaCat, setNewMediaCat] = useState("");
  const [isSavingCats, setIsSavingCats] = useState(false);

  // App Version State
  const [inputAppVersion, setInputAppVersion] = useState("");
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  useEffect(() => {
    if (settings?.appVersion) {
      setInputAppVersion(settings.appVersion);
    } else {
      setInputAppVersion(APP_VERSION);
    }
  }, [settings?.appVersion]);

  // Prevent background scrolling when session form modal is shown
  useEffect(() => {
    if (showSessionForm) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showSessionForm]);

  // App Settings Tab state
  const [navLabelsForm, setNavLabelsForm] = useState<Record<string, string>>(
    () =>
      appConfig?.navLabels || {
        dashboard: "Home Page",
        schedule: "Schedule",
        sessions: "Sessions",
        media: "News Feed",
        directory: "Staff Directory",
        profile: "My Profile",
      },
  );

  const [pageConfigs, setPageConfigs] = useState<Record<string, any>>(
    () =>
      appConfig?.pages || {
        directory: { visible: true, comingSoon: false },
        media: { visible: true, comingSoon: false },
      },
  );

  const [navOrder, setNavOrder] = useState<string[]>(
    () =>
      appConfig?.navOrder || [
        "dashboard",
        "schedule",
        "sessions",
        "media",
        "directory",
        "profile",
      ],
  );

  useEffect(() => {
    if (appConfig?.navLabels) setNavLabelsForm(appConfig.navLabels);
    if (appConfig?.pages) setPageConfigs(appConfig.pages);
    if (appConfig?.navOrder) setNavOrder(appConfig.navOrder);
  }, [appConfig]);

  const handleAppConfigSave = async () => {
    setIsGlobalLoading(true);
    try {
      const newConfig = { ...appConfig, navLabels: navLabelsForm };
      await writeJSON("appConfig.json", newConfig);
      updateAppConfig(newConfig);
      showToast("Navigation labels successfully saved!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleSaveNavOrder = async () => {
    setIsGlobalLoading(true);
    try {
      const updated = {
        ...appConfig,
        navOrder: navOrder,
      };
      await writeJSON("appConfig.json", updated);
      updateAppConfig(updated);
      showToast("Navigation order successfully saved!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save navigation order", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleSavePageSettings = async () => {
    setIsGlobalLoading(true);
    try {
      const updated = {
        ...appConfig,
        pages: pageConfigs,
      };
      await writeJSON("appConfig.json", updated);
      updateAppConfig(updated);
      showToast("Page settings successfully saved!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save page settings", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const renderAppConfigTab = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>⚙️</span> Navigation Menu Labels
        </h2>
        <p className="text-sm text-gray-500 mb-6 font-medium">
          Rename your sidebar navigation items. Changes reflect for all users
          instantly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
          {[
            { key: "dashboard", id: "Dashboard Key" },
            { key: "schedule", id: "Schedule Key" },
            { key: "sessions", id: "Sessions Key" },
            { key: "media", id: "Media Key" },
            { key: "directory", id: "Directory Key" },
            { key: "profile", id: "Profile Key" },
          ].map((item) => (
            <div key={item.key} className="flex flex-col">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                {item.id}
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all font-bold text-gray-900 bg-white"
                value={navLabelsForm[item.key] || ""}
                onChange={(e) =>
                  setNavLabelsForm((p) => ({
                    ...p,
                    [item.key]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div className="pt-6 flex justify-end">
          <button
            onClick={handleAppConfigSave}
            className="bg-black text-white px-8 py-3 rounded-xl font-black hover:bg-gray-800 transition-all shadow-lg active:scale-95 w-full sm:w-auto uppercase tracking-widest text-xs"
          >
            Save Labels
          </button>
        </div>
      </div>

      {/* Sidebar Navigation Order (Drag-to-Reorder & Up/Down Buttons) */}
      <div className="pt-8 border-t border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📂</span> Sidebar Navigation Order
        </h2>
        <p className="text-sm text-gray-500 mb-6 font-medium font-sans">
          Reorder the sidebar navigation links. Drag and drop items into your
          preferred sequence, or use the <strong>▲ Up</strong> /{" "}
          <strong>▼ Down</strong> buttons. Click <strong>Save Order</strong> to
          apply changes.
        </p>

        <div className="max-w-md space-y-2">
          {navOrder.map((key, index) => {
            // Retrieve label from labels form or fall back to standard labels
            const label =
              navLabelsForm[key] ||
              {
                dashboard: "Home Page",
                schedule: "Schedule",
                sessions: "Sessions",
                media: "News Feed",
                directory: "Staff Directory",
                profile: "My Profile",
              }[key] ||
              key;

            // Simple map of icons corresponding to each key
            const icon =
              {
                dashboard: "🏠",
                schedule: "📅",
                sessions: "🎓",
                media: "🖼️",
                directory: "👥",
                profile: "👤",
              }[key] || "📍";

            // HTML5 Drag-and-drop Handlers
            const handleDragStart = (e: DragEvent) => {
              e.dataTransfer.setData("text/plain", index.toString());
            };

            const handleDragOver = (e: DragEvent) => {
              e.preventDefault();
            };

            const handleDrop = (e: DragEvent) => {
              const sourceIndex = parseInt(
                e.dataTransfer.getData("text/plain"),
                10,
              );
              if (isNaN(sourceIndex) || sourceIndex === index) return;

              const updatedOrder = [...navOrder];
              const [removed] = updatedOrder.splice(sourceIndex, 1);
              updatedOrder.splice(index, 0, removed);
              setNavOrder(updatedOrder);
            };

            // Manual fallback controls
            const moveUp = () => {
              if (index === 0) return;
              const updatedOrder = [...navOrder];
              const temp = updatedOrder[index];
              updatedOrder[index] = updatedOrder[index - 1];
              updatedOrder[index - 1] = temp;
              setNavOrder(updatedOrder);
            };

            const moveDown = () => {
              if (index === navOrder.length - 1) return;
              const updatedOrder = [...navOrder];
              const temp = updatedOrder[index];
              updatedOrder[index] = updatedOrder[index + 1];
              updatedOrder[index + 1] = temp;
              setNavOrder(updatedOrder);
            };

            return (
              <div
                key={key}
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
                id={`nav-order-item-${key}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 select-none cursor-grab">
                    ⠿
                  </span>
                  <span className="text-xl">{icon}</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={moveUp}
                    disabled={index === 0}
                    type="button"
                    className="p-1 px-2.5 bg-white border rounded hover:bg-gray-50 border-gray-200 text-gray-600 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold transition-all cursor-pointer"
                    id={`nav-order-up-${key}`}
                    title="Move Up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={moveDown}
                    disabled={index === navOrder.length - 1}
                    type="button"
                    className="p-1 px-2.5 bg-white border rounded hover:bg-gray-50 border-gray-200 text-gray-600 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold transition-all cursor-pointer"
                    id={`nav-order-down-${key}`}
                    title="Move Down"
                  >
                    ▼
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveNavOrder}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-xl transition duration-200 outline-none shadow-md cursor-pointer uppercase tracking-wider text-xs"
            id="save-nav-order-btn"
          >
            Save Navigation Order
          </button>
        </div>
      </div>
    </div>
  );

  // Trip Info Tab state
  const [tripInfoForm, setTripInfoForm] = useState(
    () =>
      tripInfo || {
        hotel: { name: "", mapUrl: "" },
        departure: { flightNumber: "", date: "", terminal: "" },
        arrival: { flightNumber: "", date: "", terminal: "" },
      },
  );

  useEffect(() => {
    if (tripInfo) setTripInfoForm(tripInfo);
  }, [tripInfo]);

  const handleTripInfoSave = async () => {
    setIsGlobalLoading(true);
    try {
      await writeJSON("tripInfo.json", tripInfoForm);
      updateTripInfo(tripInfoForm);
      showToast("Trip Info successfully saved!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const renderTripInfoTab = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>{"\uD83C\uDFE8"}</span> Global Hotel Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Hotel Name
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={tripInfoForm.hotel.name}
              onChange={(e) =>
                setTripInfoForm((p) => ({
                  ...p,
                  hotel: { ...p.hotel, name: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Hotel Map URL
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={tripInfoForm.hotel.mapUrl}
              onChange={(e) =>
                setTripInfoForm((p) => ({
                  ...p,
                  hotel: { ...p.hotel, mapUrl: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🛫</span> Global Departure Flight
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Flight Number
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={tripInfoForm.departure.flightNumber}
              onChange={(e) =>
                setTripInfoForm((p) => ({
                  ...p,
                  departure: { ...p.departure, flightNumber: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Date
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={tripInfoForm.departure.date}
              onChange={(e) =>
                setTripInfoForm((p) => ({
                  ...p,
                  departure: { ...p.departure, date: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Terminal
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={tripInfoForm.departure.terminal}
              onChange={(e) =>
                setTripInfoForm((p) => ({
                  ...p,
                  departure: { ...p.departure, terminal: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🛬</span> Global Return Flight
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Flight Number
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={tripInfoForm.arrival.flightNumber}
              onChange={(e) =>
                setTripInfoForm((p) => ({
                  ...p,
                  arrival: { ...p.arrival, flightNumber: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Date
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={tripInfoForm.arrival.date}
              onChange={(e) =>
                setTripInfoForm((p) => ({
                  ...p,
                  arrival: { ...p.arrival, date: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Terminal
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={tripInfoForm.arrival.terminal}
              onChange={(e) =>
                setTripInfoForm((p) => ({
                  ...p,
                  arrival: { ...p.arrival, terminal: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={handleTripInfoSave}
          className="bg-black text-white px-8 py-3 rounded font-bold hover:bg-gray-800 transition-colors w-full sm:w-auto"
        >
          Save Trip Info
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (schedule && schedule.length > 0) {
      // ─── FLAT SCHEDULE/ITINERARY NORMALIZATION ───
      // If the schedule is stored in the modern flat flight/hotel card format,
      // we map it into day-by-day containers on the fly for the Admin management view.
      const isNewFlatFormat = schedule.some(
        (x: any) => x.type === "flight" || x.type === "hotel",
      );
      if (isNewFlatFormat) {
        const groupings: { [key: string]: any } = {};
        schedule.forEach((item: any) => {
          const details = item.details || {};
          const itemDate = details.date || details.checkInDate || "2026-06-25";
          if (!groupings[itemDate]) {
            groupings[itemDate] = {
              id: "pseudo-day-" + itemDate,
              date: itemDate,
              title: item.title || "Trip Event",
              items: [],
            };
          }
          groupings[itemDate].items.push({
            id: item.id || "S" + Date.now(),
            category: item.type === "flight" ? "Transport" : "Social",
            activity: item.title || "Flight/Accommodation",
            time: details.time || "12:00",
            endTime: details.checkOutTime || "",
            location: details.departureAirport || details.hotelName || "",
            notes: details.flightNumber || details.address || "",
            link:
              details.departureAirportLocation ||
              details.googleMapLocation ||
              "",
            mapLocation: details.arrivalAirportLocation || "",
            accessRoles: ["admin", "doctor", "staff"],
            accessUserIds: [],
            _rawItem: item, // Preserve the raw item reference to avoid losing custom details on update
          });
        });
        setScheduleItems(Object.values(groupings));
      } else {
        setScheduleItems(schedule);
      }
    }
  }, [schedule]);

  // Synchronize flightHotelForm deep copy whenever the schedule state update triggers
  useEffect(() => {
    if (schedule && schedule.length > 0) {
      setFlightHotelForm(JSON.parse(JSON.stringify(schedule)));
    }
  }, [schedule]);

  // Load countdown config & day-by-day trip agenda on component load
  useEffect(() => {
    readJSON("countdownConfig.json")
      .then(setCountdownConfig)
      .catch(() => {});

    readJSON("tripSchedule.json")
      .then(setTripSchedule)
      .catch(() => setTripSchedule([]));
  }, []);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setSessionItems(sessions);
    }
  }, [sessions]);

  useEffect(() => {
    if (settings) {
      setFeatureSettings(
        settings?.globalFeatures || {
          sessions: "active",
          schedule: "active",
          photoGallery: "coming_soon",
        },
      );
    }
  }, [settings]);

  useEffect(() => {
    if (selectedFeatureUser) {
      const user = users.find((u: any) => u.id === selectedFeatureUser);
      setUserFeatureAccess(user?.featureAccess || {});
      setUserVisibleFields(user?.visibleFields || {});
    }
  }, [selectedFeatureUser, users]);

  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // --- TAB 6 METHODS (Categories) ---
  const handleAddCategory = async (type: "schedule" | "media") => {
    const val = type === "schedule" ? newSchedCat.trim() : newMediaCat.trim();
    if (!val) return;

    const key = type === "schedule" ? "scheduleCategories" : "mediaCategories";
    const current =
      settings?.[key] ||
      (type === "schedule"
        ? ["Scientific", "Social", "Transport", "Other"]
        : ["Conference", "Social", "Tours", "Awards"]);

    if (current.includes(val)) {
      showToast("Category already exists", "error");
      return;
    }

    try {
      setIsSavingCats(true);
      const updatedSettings = {
        ...settings,
        [key]: [...current, val],
      };
      await writeJSON("settings.json", updatedSettings);
      updateSettings(updatedSettings);
      if (type === "schedule") setNewSchedCat("");
      else setNewMediaCat("");
      showToast("Category added", "success");
    } catch (e) {
      showToast("Failed to add category", "error");
    } finally {
      setIsSavingCats(false);
    }
  };

  const handleDeleteCategory = async (
    type: "schedule" | "media",
    cat: string,
  ) => {
    // Check if in use
    let inUse = false;
    if (type === "schedule") {
      inUse = schedule.some((day) =>
        day.items?.some((i: any) => i.category === cat),
      );
    } else {
      inUse = media.some((m) => m.category === cat);
    }

    if (inUse) {
      alert(`Category "${cat}" is currently in use and cannot be deleted.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${cat}"?`)) return;

    const key = type === "schedule" ? "scheduleCategories" : "mediaCategories";
    const current = settings?.[key] || [];

    try {
      setIsSavingCats(true);
      const updatedSettings = {
        ...settings,
        [key]: current.filter((c: string) => c !== cat),
      };
      await writeJSON("settings.json", updatedSettings);
      updateSettings(updatedSettings);
      showToast("Category deleted", "success");
    } catch (e) {
      showToast("Failed to delete category", "error");
    } finally {
      setIsSavingCats(false);
    }
  };

  const handleSaveAppVersion = async () => {
    if (!inputAppVersion.trim()) {
      showToast("App version cannot be empty", "error");
      return;
    }
    try {
      setIsSavingVersion(true);
      const updatedSettings = {
        ...settings,
        appVersion: inputAppVersion.trim(),
      };
      await writeJSON("settings.json", updatedSettings);
      updateSettings(updatedSettings);
      localStorage.setItem("appVersion", inputAppVersion.trim());
      showToast("App version updated to " + inputAppVersion.trim() + " successfully", "success");
    } catch {
      showToast("Failed to update app version", "error");
    } finally {
      setIsSavingVersion(false);
    }
  };

  // --- TAB 1 METHODS ---
  const handleSaveUser = async (
    updatedUser: any,
    applyToAllTravel: boolean = false,
    applyFeaturesToAll: boolean = false,
    applyFieldsToAll: boolean = false,
  ) => {
    let newUsers;
    if (editingUser) {
      newUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    } else {
      newUsers = [...users, updatedUser];
    }

    if (applyToAllTravel) {
      if (
        confirm(
          "Are you sure you want to apply these travel & hotel details to ALL users?",
        )
      ) {
        newUsers = newUsers.map((u) => ({
          ...u,
          flightDetails: updatedUser.flightDetails,
          hotel: updatedUser.hotel,
          transfers: updatedUser.transfers,
        }));
      }
    }

    if (applyFeaturesToAll || applyFieldsToAll) {
      if (
        confirm("Are you sure you want to apply these settings to ALL users?")
      ) {
        newUsers = newUsers.map((u) => ({
          ...u,
          ...(applyFeaturesToAll
            ? { featureAccess: updatedUser.featureAccess }
            : {}),
          ...(applyFieldsToAll
            ? { visibleFields: updatedUser.visibleFields }
            : {}),
        }));
      }
    }

    await writeJSON("users.json", newUsers);
    updateUsers(newUsers);
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this user?\nThis action cannot be undone.",
      )
    ) {
      const newUsers = users.filter((u: any) => u.id !== id);
      try {
        await writeJSON("users.json", newUsers);
        updateUsers(newUsers);
        showToast("User deleted", "success");
      } catch (e) {
        showToast("Failed to delete user", "error");
      }
    }
  };

  const handleImpersonate = (user: any) => {
    sessionStorage.setItem("euc_view_as", JSON.stringify(user));
    navigate("/dashboard");
  };

  // --- TAB 3 METHODS (Schedule) ---
  function handleAddSchedule() {
    setEditingScheduleId("new");
    setScheduleForm({
      id: "s" + Date.now(),
      date: "",
      time: "",
      endTime: "",
      category: "other",
      activity: "",
      location: "",
      link: "",
      mapLocation: "",
      notes: "",
      accessRoles: ["admin", "doctor", "staff"],
      accessUserIds: [],
    });
  }

  function handleEditSchedule(item: any) {
    if (editingScheduleId === item.id) {
      setEditingScheduleId(null);
      return;
    }
    setEditingScheduleId(item.id);
    setScheduleForm({
      ...item,
      accessRoles: item.accessRoles || ["admin", "doctor", "staff"],
      accessUserIds: item.accessUserIds || [],
    });
  }

  async function handleSaveSchedule() {
    if (!scheduleForm.activity || !scheduleForm.date || !scheduleForm.time) {
      showToast("Activity, Date and Time are required", "error");
      return;
    }

    try {
      setIsGlobalLoading(true);
      const localDatetime = `${scheduleForm.date}T${scheduleForm.time}`;
      const scheduleFormWithUtc = {
        ...scheduleForm,
        datetime_utc: localToUtc(localDatetime, inputTimezone),
      };

      let updated: any[];
      if (applyToAllSchedule) {
        if (
          !confirm(
            "Are you sure you want to apply these details to ALL schedule items?",
          )
        ) {
          setIsGlobalLoading(false);
          return;
        }
        updated = scheduleItems.map((day) => ({
          ...day,
          items:
            day.items?.map((i: any) => ({
              ...i,
              date: scheduleFormWithUtc.date,
              time: scheduleFormWithUtc.time,
              location: scheduleFormWithUtc.location,
              link: scheduleFormWithUtc.link,
              mapLocation: scheduleFormWithUtc.mapLocation,
              notes: scheduleFormWithUtc.notes,
              accessRoles: scheduleFormWithUtc.accessRoles,
              accessUserIds: scheduleFormWithUtc.accessUserIds,
              datetime_utc: scheduleFormWithUtc.datetime_utc,
            })) || [],
        }));
      } else if (editingScheduleId && editingScheduleId !== "new") {
        updated = scheduleItems.map((day) => ({
          ...day,
          items:
            day.items?.map((i: any) =>
              i.id === editingScheduleId ? { ...scheduleFormWithUtc } : i,
            ) || [],
        }));

        // If the date was changed, we might need to move it to another day container
        const currentItem = scheduleFormWithUtc;
        const originalDay = scheduleItems.find((d) =>
          d.items?.some((i: any) => i.id === editingScheduleId),
        );

        if (originalDay && originalDay.date !== currentItem.date) {
          // Remove from old day
          updated = updated
            .map((d) => ({
              ...d,
              items: d.items.filter((i: any) => i.id !== editingScheduleId),
            }))
            .filter((d) => d.items.length > 0);

          // Add to new day
          const dayIdx = updated.findIndex((d) => d.date === currentItem.date);
          if (dayIdx >= 0) {
            updated[dayIdx] = {
              ...updated[dayIdx],
              items: [...updated[dayIdx].items, currentItem],
            };
          } else {
            updated.push({
              id: "d" + Date.now(),
              date: currentItem.date,
              title: "Schedule",
              items: [currentItem],
            });
          }
        }
      } else {
        // Find existing day or create new
        const dayIdx = scheduleItems.findIndex(
          (d) => d.date === scheduleFormWithUtc.date,
        );
        updated = [...scheduleItems];
        if (dayIdx >= 0) {
          updated[dayIdx] = {
            ...updated[dayIdx],
            items: [
              ...(updated[dayIdx].items || []),
              { ...scheduleFormWithUtc },
            ],
          };
        } else {
          updated.push({
            id: "d" + Date.now(),
            date: scheduleFormWithUtc.date,
            title: "Schedule",
            items: [{ ...scheduleFormWithUtc }],
          });
        }
      }

      // Sort items by time within days
      updated = updated
        .map((day) => ({
          ...day,
          items: [...day.items].sort((a, b) => a.time.localeCompare(b.time)),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Reconstuct flat items if the schedule is in the modern flat flight/hotel format
      const isNewFlatFormat =
        schedule &&
        schedule.some((x: any) => x.type === "flight" || x.type === "hotel");
      if (isNewFlatFormat) {
        const flatResult: any[] = [];
        updated.forEach((day: any) => {
          day.items?.forEach((item: any) => {
            if (item._rawItem) {
              const updatedDetails = { ...item._rawItem.details };
              if (item._rawItem.type === "flight") {
                updatedDetails.flightNumber =
                  item.notes || updatedDetails.flightNumber;
                updatedDetails.date = day.date;
                updatedDetails.time = item.time;
                updatedDetails.departureAirport =
                  item.location || updatedDetails.departureAirport;
                updatedDetails.departureAirportLocation =
                  item.link || updatedDetails.departureAirportLocation;
                updatedDetails.arrivalAirportLocation =
                  item.mapLocation || updatedDetails.arrivalAirportLocation;
              } else if (item._rawItem.type === "hotel") {
                updatedDetails.hotelName =
                  item.location || updatedDetails.hotelName;
                updatedDetails.checkInDate = day.date;
                updatedDetails.address = item.notes || updatedDetails.address;
                updatedDetails.googleMapLocation =
                  item.link || updatedDetails.googleMapLocation;
              }
              flatResult.push({
                ...item._rawItem,
                title: item.activity,
                details: updatedDetails,
              });
            } else {
              // A newly created custom item
              flatResult.push({
                id: item.id || "S" + Date.now(),
                type: "flight",
                title: item.activity,
                direction: "outbound",
                visibility: "all_users",
                details: {
                  flightNumber: item.notes || "Flight",
                  date: day.date,
                  time: item.time,
                  departureAirport: item.location || "",
                  departureAirportLocation: item.link || "",
                  departureTerminal: "",
                  departureGate: "",
                  arrivalAirport: "",
                  arrivalAirportLocation: item.mapLocation || "",
                },
              });
            }
          });
        });
        setScheduleItems(updated);
        await writeJSON("schedule.json", flatResult);
        updateSchedule(flatResult);
      } else {
        setScheduleItems(updated);
        await writeJSON("schedule.json", updated);
        updateSchedule(updated);
      }

      setEditingScheduleId(null);
      setApplyToAllSchedule(false);
      showToast("Schedule saved successfully ✓", "success");
    } catch (err) {
      showToast("Failed to save schedule", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  }

  async function handleDeleteSchedule(id: string) {
    if (!confirm("Delete this schedule item?")) return;
    try {
      setIsGlobalLoading(true);
      const updated = scheduleItems
        .map((day) => ({
          ...day,
          items: day.items?.filter((i: any) => i.id !== id) || [],
        }))
        .filter((day) => day.items.length > 0);

      const isNewFlatFormat =
        schedule &&
        schedule.some((x: any) => x.type === "flight" || x.type === "hotel");
      if (isNewFlatFormat) {
        const flatResult: any[] = [];
        updated.forEach((day: any) => {
          day.items?.forEach((item: any) => {
            if (item._rawItem) {
              flatResult.push(item._rawItem);
            } else {
              flatResult.push({
                id: item.id || "S" + Date.now(),
                type: "flight",
                title: item.activity,
                direction: "outbound",
                visibility: "all_users",
                details: {
                  flightNumber: item.notes || "Flight",
                  date: day.date,
                  time: item.time,
                  departureAirport: item.location || "",
                  departureAirportLocation: item.link || "",
                  departureTerminal: "",
                  departureGate: "",
                  arrivalAirport: "",
                  arrivalAirportLocation: item.mapLocation || "",
                },
              });
            }
          });
        });
        setScheduleItems(updated);
        await writeJSON("schedule.json", flatResult);
        updateSchedule(flatResult);
      } else {
        setScheduleItems(updated);
        await writeJSON("schedule.json", updated);
        updateSchedule(updated);
      }
      showToast("Schedule item deleted", "success");
    } catch (err) {
      showToast("Failed to delete", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  }

  // --- TAB 3 METHODS (Sessions) ---
  function handleAddSession() {
    setEditingSession(null);
    setInputTimezone("Africa/Cairo");
    setSessionForm({
      id: "ses" + Date.now(),
      title: "",
      speaker: "",
      speakerJob: "",
      date: "",
      time: "",
      toTime: "",
      hall: "",
      link: "",
      linkUrl: "",
      linkTitle: "",
      timezoneDisplay: "both",
      speakerPhoto: "",
      speakerWhatsApp: "",
    });
    setShowSessionForm(true);
  }

  function handleEditSession(item: any) {
    setEditingSession(item);
    setSessionForm({
      id: item.id || "",
      title: item.title || "",
      speaker: item.speaker || "",
      speakerJob: item.speakerJob || "",
      date: item.date || "",
      time: item.time || "",
      toTime: item.toTime || "",
      hall: item.hall || "",
      link: item.link || item.linkUrl || "",
      linkUrl: item.linkUrl || item.link || "",
      linkTitle: item.linkTitle || "",
      timezoneDisplay: item.timezoneDisplay || "both",
      speakerPhoto: item.speakerPhoto || "",
      speakerWhatsApp: item.speakerWhatsApp || "",
    });
    setInputTimezone(item.inputTimezone || "Africa/Cairo");
    setShowSessionForm(true);
  }

  async function handleSaveSession() {
    if (isSavingSession) return;
    try {
      setIsSavingSession(true);
      const localDatetime = `${sessionForm.date}T${sessionForm.time}`;
      const sessionFormWithUtc = {
        ...sessionForm,
        inputTimezone,
        link: sessionForm.linkUrl || sessionForm.link || "",
        linkUrl: sessionForm.linkUrl || sessionForm.link || "",
        datetime_utc: localToUtc(localDatetime, inputTimezone),
      };

      let updated: any[];
      if (editingSession) {
        updated = sessionItems.map((s) =>
          s.id === editingSession.id ? { ...sessionFormWithUtc } : s,
        );
      } else {
        updated = [...sessionItems, { ...sessionFormWithUtc }];
      }
      setSessionItems(updated);
      await writeJSON("sessions.json", updated);
      updateSessions(updated);
      setShowSessionForm(false);
      setEditingSession(null);
      showToast("Session saved successfully ✓", "success");
    } catch (err) {
      showToast("Failed to save session", "error");
    } finally {
      setIsSavingSession(false);
    }
  }

  async function handleDeleteSession(id: string) {
    if (!confirm("Delete this session?")) return;
    try {
      setIsGlobalLoading(true);
      const updated = sessionItems.filter((s) => s.id !== id);
      setSessionItems(updated);
      await writeJSON("sessions.json", updated);
      updateSessions(updated);
      showToast("Session deleted", "success");
    } catch (err) {
      showToast("Failed to delete", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  }

  // --- TAB 4 METHODS ---
  async function handleSaveGlobalFeatures() {
    try {
      setIsSavingFeatures(true);
      const updatedSettings = {
        ...settings,
        globalFeatures: featureSettings,
      };
      await writeJSON("settings.json", updatedSettings);
      updateSettings(updatedSettings);

      if (applyFeaturesToAllUsers) {
        if (
          confirm(
            "Are you sure you want to apply these feature settings to ALL users?",
          )
        ) {
          const statusMap: any = {
            active: { access: true, status: "full" },
            coming_soon: { access: true, status: "coming_soon" },
            disabled: { access: false, status: "coming_soon" },
          };
          const newAccess: any = {};
          for (const k in featureSettings) {
            newAccess[k] = statusMap[featureSettings[k] || "active"];
          }
          const updatedUsers = users.map((u) => ({
            ...u,
            featureAccess: newAccess,
          }));
          await writeJSON("users.json", updatedUsers);
          updateUsers(updatedUsers);
        }
        setApplyFeaturesToAllUsers(false);
      }

      showToast("Global features saved ✓", "success");
    } catch (err) {
      showToast("Failed to save features", "error");
    } finally {
      setIsSavingFeatures(false);
    }
  }

  async function handleSaveUserFeatureAccess() {
    try {
      setIsSavingFeatures(true);
      const updated = users.map((u: any) =>
        u.id === selectedFeatureUser
          ? {
              ...u,
              featureAccess: userFeatureAccess,
              visibleFields: userVisibleFields,
            }
          : u,
      );
      await writeJSON("users.json", updated);
      updateUsers(updated);
      showToast("User access saved ✓", "success");
    } catch (err) {
      showToast("Failed to save user access", "error");
    } finally {
      setIsSavingFeatures(false);
    }
  }

  const filteredUsers = users
    .filter((u: any) => roleFilter === "all" || u.role === roleFilter)
    .filter((u: any) => {
      if (!userSearchQuery) return true;
      const q = userSearchQuery.trim().toLowerCase();
      const hay = [u.name, u.username, u.role, u.email, u.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

  const renderTab1 = () => {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">User Management</h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto font-bold">
            <input
              type="text"
              placeholder="🔍 Search users..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="p-2 border rounded w-full sm:w-64 font-medium"
            />
            <button
              onClick={() => {
                setEditingUser(null);
                setModalOpen(true);
              }}
              className="bg-yellow-500 hover:bg-yellow-600 p-2 px-4 rounded font-bold cursor-pointer transition-colors whitespace-nowrap"
            >
              + Create New User
            </button>
          </div>
        </div>

        {/* Filters and View Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Filter:
            </span>
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-black bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            >
              <option value="all">📁 All Roles</option>
              <option value="admin">🔧 Admin</option>
              <option value="doctor">🩺 Doctor</option>
              <option value="staff">💼 Staff</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              View:
            </span>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200 font-bold text-xs">
              <button
                onClick={() => handleViewModeChange("list")}
                className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${
                  viewMode === "list"
                    ? "bg-yellow-400 text-black shadow-sm"
                    : "text-gray-600 hover:text-black hover:bg-gray-100"
                }`}
                title="List View"
              >
                ≡ List
              </button>
              <button
                onClick={() => handleViewModeChange("grid")}
                className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${
                  viewMode === "grid"
                    ? "bg-yellow-400 text-black shadow-sm"
                    : "text-gray-600 hover:text-black hover:bg-gray-100"
                }`}
                title="Grid View"
              >
                ⊞ Grid
              </button>
            </div>
          </div>
        </div>

        <UserControlCard
          isOpen={modalOpen}
          mode={editingUser ? "edit" : "create"}
          user={editingUser}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveUser}
        />

        {viewMode === "list" ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Mobile List View */}
            <div className="md:hidden divide-y text-sm">
              {filteredUsers.map((u: any) => (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} size="md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">
                        {u.name}
                      </h4>
                      <p className="text-gray-500 truncate">{u.username}</p>
                      {u.phone && (
                        <p className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
                          <span>📞 {displayPhone(u.phone)}</span>
                          <span className="text-gray-300">|</span>
                          <a
                            href={callHref(u.phone)}
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            Call
                          </a>
                          <span className="text-gray-300">|</span>
                          <a
                            href={whatsappHref(u.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 font-bold"
                          >
                            WhatsApp
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === "admin"
                          ? "bg-yellow-200 text-yellow-800"
                          : u.role === "doctor"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                      <span
                        className={`w-2 h-2 rounded-full ${u.isActive ? "bg-green-500" : "bg-red-500"}`}
                      ></span>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 font-bold">
                    <button
                      onClick={() => handleImpersonate(u)}
                      className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-center font-bold"
                    >
                      👁 View
                    </button>
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setModalOpen(true);
                      }}
                      className="flex-1 py-1.5 text-blue-600 hover:bg-blue-50 bg-blue-50 rounded text-xs text-center font-bold"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="flex-1 py-1.5 text-red-600 hover:bg-red-50 bg-red-50 rounded text-xs text-center font-bold"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No users found.
                </div>
              )}
            </div>

            {/* Desktop List View */}
            <div className="hidden md:block overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 rounded-tl-lg">Photo</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredUsers.map((u: any) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <UserAvatar user={u} size="md" />
                      </td>
                      <td className="p-4 font-semibold">
                        <div>{u.name}</div>
                        {u.phone && (
                          <div className="text-xs text-gray-500 font-normal flex items-center gap-2 mt-1">
                            <span>📞 {displayPhone(u.phone)}</span>
                            <span className="text-gray-300">|</span>
                            <a
                              href={callHref(u.phone)}
                              className="text-blue-600 hover:text-blue-800 font-bold"
                            >
                              Call
                            </a>
                            <span className="text-gray-300">|</span>
                            <a
                              href={whatsappHref(u.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 font-bold"
                            >
                              WhatsApp
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-gray-500">{u.username}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            u.role === "admin"
                              ? "bg-yellow-200 text-yellow-800"
                              : u.role === "doctor"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${u.isActive ? "bg-green-500" : "bg-red-500"}`}
                          ></span>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-bold font-sans">
                          <button
                            onClick={() => handleImpersonate(u)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold flex items-center gap-1"
                          >
                            👁 View
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setModalOpen(true);
                            }}
                            className="px-2 py-1 text-blue-600 hover:bg-blue-50 bg-blue-50 rounded text-xs font-bold"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-2 py-1 text-red-600 hover:bg-red-0 hover:bg-red-50 bg-red-50 rounded text-xs font-bold"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View Layout */
          <div>
            {roleFilter === "all" ? (
              /* Grouped by Role */
              ["admin", "doctor", "staff"].map((role) => {
                const group = filteredUsers.filter((u) => u.role === role);
                if (group.length === 0) return null;
                return (
                  <div key={role} className="mb-8 font-sans">
                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 px-1 border-b pb-2 flex justify-between items-center">
                      <span>
                        {role === "admin"
                          ? "🔧 Admin"
                          : role === "doctor"
                            ? "🩺 Doctor"
                            : "💼 Staff"}
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] text-gray-500">
                        {group.length} users
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {group.map((user) => (
                        <UserGridCard
                          key={user.id}
                          user={user}
                          onView={handleImpersonate}
                          onEdit={(u) => {
                            setEditingUser(u);
                            setModalOpen(true);
                          }}
                          onDelete={handleDeleteUser}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              /* Flat Grid View when specific role filtered */
              <div>
                {filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
                    No users found for this role filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in font-sans">
                    {filteredUsers.map((user) => (
                      <UserGridCard
                        key={user.id}
                        user={user}
                        onView={handleImpersonate}
                        onEdit={(u) => {
                          setEditingUser(u);
                          setModalOpen(true);
                        }}
                        onDelete={handleDeleteUser}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- SMART COUNTDOWN HANDLERS ---
  const handleSaveCountdownConfig = async (updatedConfig?: any) => {
    setIsGlobalLoading(true);
    const toSave = updatedConfig || countdownConfig;
    try {
      await writeJSON("countdownConfig.json", toSave);
      setCountdownConfig(toSave);
      showToast("Countdown settings saved successfully ✓", "success");
    } catch (e) {
      showToast("Failed to save countdown settings", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleEditCountdownEntry = (entry: any) => {
    setEditingId(entry.id);
    const tz = entry.inputTimezone || "Africa/Cairo";
    const localDt = utcToLocalInput(entry.datetime, tz);
    
    setNewTimelineEntry({
      label: entry.label ?? "",
      datetime: localDt,
      icon: entry.icon ?? "📌",
      color: entry.color ?? "gray",
      inputTimezone: tz,
      timezoneDisplay: entry.timezoneDisplay ?? "both",
    });
    setIconInput(entry.icon ?? "📌");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- FLIGHT & HOTEL LOGISTICS HANDLERS ---
  const updateFlightHotelField = (id: string, field: string, value: any) => {
    setFlightHotelForm((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            details: {
              ...(item.details || {}),
              [field]: value,
            },
          };
        }
        return item;
      }),
    );
  };

  const handleSaveFlightHotelDetails = async () => {
    setIsGlobalLoading(true);
    try {
      await writeJSON("schedule.json", flightHotelForm);
      updateSchedule(flightHotelForm);
      showToast("Flight & Hotel Logistics saved successfully ✓", "success");
    } catch (e) {
      showToast("Failed to save Flight & Hotel Logistics", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  // --- TRIP SCHEDULE DAILY AGENDA HANDLERS ---
  const handleAddTripDay = () => {
    const newDay = {
      id: "TSD_" + Date.now(),
      day: `Day ${tripSchedule.length + 1}`,
      date: "2026-06-25",
      title: "New Day Title",
      events: [],
    };
    const updated = [...tripSchedule, newDay];
    setTripSchedule(updated);
  };

  const handleDeleteTripDay = (dayId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this full day card and all its nested events?",
      )
    )
      return;
    const updated = tripSchedule.filter((d) => d.id !== dayId);
    setTripSchedule(updated);
  };

  const handleUpdateTripDayHeader = (
    dayId: string,
    field: string,
    value: any,
  ) => {
    const updated = tripSchedule.map((d) => {
      if (d.id === dayId) {
        return { ...d, [field]: value };
      }
      return d;
    });
    setTripSchedule(updated);
  };

  const handleAddTripEvent = (dayId: string) => {
    const newEvent = {
      id: "TSE_" + Date.now(),
      time: "12:00",
      label: "New Event Activity",
      icon: "📌",
      type: "session",
    };
    const updated = tripSchedule.map((d) => {
      if (d.id === dayId) {
        return {
          ...d,
          events: [...(d.events || []), newEvent],
        };
      }
      return d;
    });
    setTripSchedule(updated);
  };

  const handleDeleteTripEvent = (dayId: string, eventId: string) => {
    const updated = tripSchedule.map((d) => {
      if (d.id === dayId) {
        return {
          ...d,
          events: (d.events || []).filter((e: any) => e.id !== eventId),
        };
      }
      return d;
    });
    setTripSchedule(updated);
  };

  const handleUpdateTripEventField = (
    dayId: string,
    eventId: string,
    field: string,
    value: any,
  ) => {
    const updated = tripSchedule.map((d) => {
      if (d.id === dayId) {
        return {
          ...d,
          events: (d.events || []).map((e: any) => {
            if (e.id === eventId) {
              return { ...e, [field]: value };
            }
            return e;
          }),
        };
      }
      return d;
    });
    setTripSchedule(updated);
  };

  const handleSaveTripSchedule = async () => {
    setIsGlobalLoading(true);
    // Sort day cards and events inside days
    let sorted = tripSchedule.map((d) => ({
      ...d,
      events: [...(d.events || [])].sort((a, b) =>
        (a.time || "").localeCompare(b.time || ""),
      ),
    }));
    sorted.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    try {
      await writeJSON("tripSchedule.json", sorted);
      setTripSchedule(sorted);
      showToast("Trip Schedule Agenda saved successfully ✓", "success");
    } catch (e) {
      showToast("Failed to save Trip Schedule Agenda", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const renderTab3 = () => (
    <div>
      <h2 className="text-xl font-bold mb-6">Schedule & Sessions Control</h2>

      {/* ── SUB-TABS SELECTOR FOR SCHEDULE vs SESSIONS ── */}
      <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:max-w-md mb-6 font-sans">
        <button
          type="button"
          onClick={() => setScheduleSubTab("schedule")}
          className={`flex-1 text-center py-2 text-sm font-bold rounded-md transition-all cursor-pointer ${
            scheduleSubTab === "schedule"
              ? "bg-white text-black shadow-sm"
              : "text-gray-500 hover:text-gray-950"
          }`}
        >
          📅 Schedule & Settings
        </button>
        <button
          type="button"
          onClick={() => setScheduleSubTab("sessions")}
          className={`flex-1 text-center py-2 text-sm font-bold rounded-md transition-all cursor-pointer ${
            scheduleSubTab === "sessions"
              ? "bg-white text-black shadow-sm"
              : "text-gray-500 hover:text-gray-950"
          }`}
        >
          🎓 Sessions
        </button>
      </div>

      {scheduleSubTab === "schedule" && (
        <>
          {/* ── 1. COUNTDOWN & TIMELINE SETTINGS ──────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 mb-8 font-sans">
        <h3 className="font-extrabold text-lg text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
          <span>⏱️</span> Smart Countdown & Timeline Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
              Custom Alert Bar Message / Supplemental Announcement
            </label>
            <input
              type="text"
              placeholder="e.g. Please make sure to fill out the pre-arrival survey!"
              value={countdownConfig?.customMessage || ""}
              onChange={(e) =>
                setCountdownConfig({
                  ...countdownConfig,
                  customMessage: e.target.value,
                })
              }
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none text-sm text-gray-950"
            />
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              This message overlays the active countdown with an italicized
              secondary banner on the guest dashboard.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Timeline Visibility
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer bg-gray-50 border border-gray-200 rounded-lg p-3 w-fit">
              <input
                type="checkbox"
                checked={countdownConfig?.showTimeline}
                onChange={(e) =>
                  setCountdownConfig({
                    ...countdownConfig,
                    showTimeline: e.target.checked,
                  })
                }
                className="accent-yellow-500 w-5 h-5 shadow-sm"
              />
              <span className="text-sm font-semibold text-gray-800">
                Show Live Timeline List on Guest Dashboard
              </span>
            </label>
          </div>
        </div>

        {/* Custom Entries manager */}
        <div ref={formRef} className="mt-6 border-t border-gray-100 pt-6">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">
            {editingId ? "✏️ Edit Event" : "➕ Add Custom Marker to Timeline (E.g. Visa Deadline, Visa App, Luggage Drop-off)"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 text-xs font-sans">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Label / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Visa Deadline"
                value={newTimelineEntry.label}
                onChange={(e) =>
                  setNewTimelineEntry({
                    ...newTimelineEntry,
                    label: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded bg-white text-xs mt-1 text-gray-950 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={newTimelineEntry.datetime}
                onChange={(e) =>
                  setNewTimelineEntry({
                    ...newTimelineEntry,
                    datetime: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded bg-white text-xs mt-1 text-gray-950 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />

              {/* Timezone Selector for Timeline Entries */}
              <div className="flex flex-col mt-2">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Timezone</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="timelineMarkerTz"
                      value="Africa/Cairo"
                      checked={(newTimelineEntry.inputTimezone || "Africa/Cairo") === "Africa/Cairo"}
                      onChange={() => setNewTimelineEntry({
                        ...newTimelineEntry,
                        inputTimezone: "Africa/Cairo"
                      })}
                      className="accent-yellow-500 w-3 h-3"
                    />
                    <span className="text-[10px] text-gray-750 font-semibold">🇪🇬 Cairo</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="timelineMarkerTz"
                      value="Europe/Prague"
                      checked={(newTimelineEntry.inputTimezone || "Africa/Cairo") === "Europe/Prague"}
                      onChange={() => setNewTimelineEntry({
                        ...newTimelineEntry,
                        inputTimezone: "Europe/Prague"
                      })}
                      className="accent-yellow-500 w-3 h-3"
                    />
                    <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague</span>
                  </label>
                </div>
              </div>

              {/* Timezone Display Mode Selector for Timeline Entries */}
              <div className="flex flex-col mt-2">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Show time to users as</label>
                <div className="flex flex-col gap-1 mt-1">
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="timelineMarkerTzDisp"
                      value="both"
                      checked={(newTimelineEntry.timezoneDisplay || "both") === "both"}
                      onChange={() => setNewTimelineEntry({
                        ...newTimelineEntry,
                        timezoneDisplay: "both"
                      })}
                      className="accent-yellow-500 w-3 h-3"
                    />
                    <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague + 🇪🇬 Cairo</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="timelineMarkerTzDisp"
                      value="prague"
                      checked={(newTimelineEntry.timezoneDisplay || "both") === "prague"}
                      onChange={() => setNewTimelineEntry({
                        ...newTimelineEntry,
                        timezoneDisplay: "prague"
                      })}
                      className="accent-yellow-500 w-3 h-3"
                    />
                    <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague only</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="timelineMarkerTzDisp"
                      value="cairo"
                      checked={(newTimelineEntry.timezoneDisplay || "both") === "cairo"}
                      onChange={() => setNewTimelineEntry({
                        ...newTimelineEntry,
                        timezoneDisplay: "cairo"
                      })}
                      className="accent-yellow-500 w-3 h-3"
                    />
                    <span className="text-[10px] text-gray-750 font-semibold">🇪🇬 Cairo only</span>
                  </label>
                </div>
              </div>

              {/* Live Preview for Timeline Entry */}
              {newTimelineEntry.datetime && (() => {
                const tz = newTimelineEntry.inputTimezone || "Africa/Cairo";
                try {
                  const utc = localToUtc(newTimelineEntry.datetime, tz);
                  const pDisp = utcToDisplay(utc, TZ_PRAGUE).time;
                  const cDisp = utcToDisplay(utc, TZ_CAIRO).time;
                  return (
                    <div className="text-[9px] bg-yellow-50/40 p-1.5 rounded border border-yellow-105/50 text-gray-650 font-semibold leading-normal flex flex-col justify-center mt-1.5">
                      <div>🇨🇿 PRG: <strong>{pDisp}</strong></div>
                      <div className="mt-0.5">🇪🇬 CAI: <strong>{cDisp}</strong></div>
                    </div>
                  );
                } catch { return null; }
              })()}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Icon
                </label>
                <input
                  type="text"
                  value={iconInput}
                  onChange={(e) => setIconInput(e.target.value)}
                  placeholder="Type emoji or symbol e.g. ✈️ 🏨 🎓 ⚕️"
                  maxLength={4}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-xs mt-1 text-gray-950 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                />
                <p className="text-[9px] text-gray-400">
                  Type any emoji directly — or pick one below
                </p>
              </div>
              <div className="flex flex-col gap-1 mt-1 font-sans">
                <label className="text-[9px] text-gray-400">
                  Quick pick
                </label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto border border-gray-200 p-1.5 rounded-lg bg-white">
                  {["✈️", "🛬", "🛫", "🚌", "🏨", "🎓", "🏥", "⚕️",
                    "🍽️", "☕", "🎤", "📋", "🗓️", "🔬", "💊", "🩺",
                    "🎯", "🏆", "📍", "⏰", "🚶", "🧳", "🛂", "🎪"].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setIconInput(icon)}
                      className={`w-7 h-7 flex items-center justify-center rounded text-sm border transition-all cursor-pointer
                        ${iconInput === icon
                          ? "border-yellow-400 bg-yellow-50 scale-105"
                          : "border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50"
                        }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Badge Color
              </label>
              <select
                value={newTimelineEntry.color}
                onChange={(e) =>
                  setNewTimelineEntry({
                    ...newTimelineEntry,
                    color: e.target.value as any,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded bg-white text-xs mt-1 text-gray-950 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="gray">Gray</option>
                <option value="yellow">Yellow</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="red">Red</option>
              </select>
            </div>
            <div className="flex flex-col justify-end gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!newTimelineEntry.label || !newTimelineEntry.datetime) {
                    showToast(
                      "Label and Date-Time are required for timeline marker",
                      "error",
                    );
                    return;
                  }
                  const isEditing = !!editingId;
                  const finalIcon = iconInput.trim() || "📌";
                  const entry = {
                    id: isEditing ? editingId : "CT_" + Date.now(),
                    label: newTimelineEntry.label,
                    datetime: localToUtc(newTimelineEntry.datetime, newTimelineEntry.inputTimezone || "Africa/Cairo"),
                    icon: finalIcon,
                    color: newTimelineEntry.color,
                    inputTimezone: newTimelineEntry.inputTimezone || "Africa/Cairo",
                    timezoneDisplay: newTimelineEntry.timezoneDisplay || "both",
                  };
                  
                  let updatedEntries = [];
                  if (isEditing) {
                    updatedEntries = (countdownConfig?.customTimelineEntries || []).map((e: any) => 
                      e.id === editingId ? entry : e
                    );
                    setEditingId(null);
                  } else {
                    updatedEntries = [
                      ...(countdownConfig?.customTimelineEntries || []),
                      entry,
                    ];
                  }

                  const updated = {
                    ...countdownConfig,
                    customTimelineEntries: updatedEntries,
                  };
                  setCountdownConfig(updated);
                  setNewTimelineEntry({
                    label: "",
                    datetime: "",
                    icon: "📌",
                    color: "gray",
                    inputTimezone: "Africa/Cairo",
                    timezoneDisplay: "both",
                  });
                  setIconInput("📌");
                  showToast(
                    isEditing ? "Marker updated locally. Press Save to persist." : "Marker appended locally. Press Save to persist.",
                    "info",
                  );
                }}
                className="w-full bg-black text-white px-4 py-2 rounded text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {editingId ? "💾 Save Changes" : "＋ Append Entry"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setNewTimelineEntry({
                      label: "",
                      datetime: "",
                      icon: "📌",
                      color: "gray",
                      inputTimezone: "Africa/Cairo",
                      timezoneDisplay: "both",
                    });
                    setIconInput("📌");
                  }}
                  className="w-full bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Markers List */}
          <div className="space-y-2 mt-4 max-h-52 overflow-y-auto pr-2">
            {(countdownConfig?.customTimelineEntries || []).map(
              (entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{entry.icon}</span>
                    <div>
                      <span className="font-bold text-gray-950">
                        {entry.label}
                      </span>
                      <span className="text-gray-400 ml-2 font-mono">
                        {entry.datetime.replace("T", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditCountdownEntry(entry)}
                      className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg"
                           className="w-4 h-4" viewBox="0 0 24 24"
                           fill="none" stroke="currentColor"
                           strokeWidth="2" strokeLinecap="round"
                           strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14
                                 a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15
                                 l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const filtered =
                          countdownConfig.customTimelineEntries.filter(
                            (e: any) => e.id !== entry.id,
                          );
                        setCountdownConfig({
                          ...countdownConfig,
                          customTimelineEntries: filtered,
                        });
                        if (editingId === entry.id) {
                          setEditingId(null);
                          setNewTimelineEntry({
                            label: "",
                            datetime: "",
                            icon: "📌",
                            color: "gray",
                            inputTimezone: "Africa/Cairo",
                            timezoneDisplay: "both",
                          });
                          setIconInput("📌");
                        }
                      }}
                      className="text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 hover:bg-red-105 rounded cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ),
            )}
            {(countdownConfig?.customTimelineEntries || []).length === 0 && (
              <p className="text-xs text-center p-3 text-gray-400 bg-gray-50 border border-dashed rounded italic">
                No custom timeline entries defined.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-5 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={() => handleSaveCountdownConfig()}
            className="px-6 py-2 rounded bg-black text-white hover:bg-gray-800 font-bold transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm"
          >
            💾 Save Countdown Configuration
          </button>
        </div>
      </div>

      {/* ── 2. SECTION A: FLIGHT & HOTEL LOGISTICS (schedule.json) ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 mb-8 font-sans">
        <h3 className="font-extrabold text-lg text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
          <span>{"\u2708\uFE0F"}</span> Section A: Flight & Hotel Details
          (schedule.json)
        </h3>

        <p className="text-sm text-gray-500 mb-6">
          These details populate the personal trip info summary cards on the
          Dashboard and the beautiful full summary cards on user Profiles.
        </p>

        {flightHotelForm.map((item) => {
          const isFlight = item.type === "flight";
          const isOutbound = item.direction === "outbound";

          return (
            <div
              key={item.id}
              className="border border-gray-200 rounded-xl overflow-hidden mb-6"
            >
              <div className="bg-gray-50 px-4 py-2.5 font-bold text-sm text-gray-800 border-b border-gray-200 flex items-center justify-between">
                <span>
                  {item.title ||
                    (isFlight
                      ? isOutbound
                        ? "\u2708\uFE0F Outbound Flight"
                        : "\u2708\uFE0F Inbound Flight"
                      : "\uD83C\uDFE8 Accommodation")}
                </span>
                <span className="text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded font-mono font-bold">
                  {item.id}
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                {isFlight ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Flight Number
                      </label>
                      <input
                        type="text"
                        value={item.details?.flightNumber || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "flightNumber",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Date (YYYY-MM-DD)
                      </label>
                      <input
                        type="date"
                        value={item.details?.date || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "date",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Time (HH:MM)
                      </label>
                      <input
                        type="time"
                        value={item.details?.time || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "time",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />

                      {/* Timezone Selector for Flight Details */}
                      <div className="flex flex-col mt-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Flight Time Timezone</label>
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminFlightTz-${item.id}`}
                              value="Africa/Cairo"
                              checked={(item.details?.inputTimezone || "Africa/Cairo") === "Africa/Cairo"}
                              onChange={() => updateFlightHotelField(item.id, "inputTimezone", "Africa/Cairo")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-xs text-gray-700">🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminFlightTz-${item.id}`}
                              value="Europe/Prague"
                              checked={(item.details?.inputTimezone || "Africa/Cairo") === "Europe/Prague"}
                              onChange={() => updateFlightHotelField(item.id, "inputTimezone", "Europe/Prague")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-xs text-gray-700">🇨🇿 Prague</span>
                          </label>
                        </div>
                      </div>

                      {/* Timezone Display Mode Selector for Flight Details */}
                      <div className="flex flex-col mt-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Show time to users as</label>
                        <div className="flex flex-col gap-1 mt-1">
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminFlightTzDisp-${item.id}`}
                              value="both"
                              checked={(item.details?.timezoneDisplay || "both") === "both"}
                              onChange={() => updateFlightHotelField(item.id, "timezoneDisplay", "both")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague + 🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminFlightTzDisp-${item.id}`}
                              value="prague"
                              checked={(item.details?.timezoneDisplay || "both") === "prague"}
                              onChange={() => updateFlightHotelField(item.id, "timezoneDisplay", "prague")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague only</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminFlightTzDisp-${item.id}`}
                              value="cairo"
                              checked={(item.details?.timezoneDisplay || "both") === "cairo"}
                              onChange={() => updateFlightHotelField(item.id, "timezoneDisplay", "cairo")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-750 font-semibold">🇪🇬 Cairo only</span>
                          </label>
                        </div>
                      </div>

                      {/* Live Preview for Flight Details */}
                      {(() => {
                        const d = item.details?.date;
                        const t = item.details?.time;
                        const tz = item.details?.inputTimezone || "Africa/Cairo";
                        if (!d || !t) return null;
                        try {
                          const utc = localToUtc(`${d}T${t}`, tz);
                          const pDisp = utcToDisplay(utc, TZ_PRAGUE).time;
                          const cDisp = utcToDisplay(utc, TZ_CAIRO).time;
                          return (
                            <div className="text-[10px] bg-yellow-50/50 p-1.5 rounded border border-yellow-101/55 text-gray-650 font-semibold leading-normal flex flex-col justify-center mt-1">
                              <div>🇨🇿 PRG: <strong>{pDisp}</strong></div>
                              <div className="mt-0.5">🇪🇬 CAI: <strong>{cDisp}</strong></div>
                            </div>
                          );
                        } catch { return null; }
                      })()}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Departure Airport
                      </label>
                      <input
                        type="text"
                        value={item.details?.departureAirport || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "departureAirport",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Departure Airport Map Link
                      </label>
                      <input
                        type="url"
                        value={item.details?.departureAirportLocation || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "departureAirportLocation",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Arrival Airport
                      </label>
                      <input
                        type="text"
                        value={item.details?.arrivalAirport || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "arrivalAirport",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Arrival Airport Map Link
                      </label>
                      <input
                        type="url"
                        value={item.details?.arrivalAirportLocation || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "arrivalAirportLocation",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Terminal
                      </label>
                      <input
                        type="text"
                        value={item.details?.departureTerminal || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "departureTerminal",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Gate
                      </label>
                      <input
                        type="text"
                        value={item.details?.departureGate || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "departureGate",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Hotel Name
                      </label>
                      <input
                        type="text"
                        value={item.details?.hotelName || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "hotelName",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Check-In Date
                      </label>
                      <input
                        type="date"
                        value={item.details?.checkInDate || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "checkInDate",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Check-In Time
                      </label>
                      <input
                        type="time"
                        value={item.details?.checkInTime || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "checkInTime",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />

                      {/* Timezone Selector for Check-In */}
                      <div className="flex flex-col mt-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Check-In Timetimezone</label>
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckInTz-${item.id}`}
                              value="Africa/Cairo"
                              checked={(item.details?.inputTimezoneCheckIn || "Africa/Cairo") === "Africa/Cairo"}
                              onChange={() => updateFlightHotelField(item.id, "inputTimezoneCheckIn", "Africa/Cairo")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-xs text-gray-700">🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckInTz-${item.id}`}
                              value="Europe/Prague"
                              checked={(item.details?.inputTimezoneCheckIn || "Africa/Cairo") === "Europe/Prague"}
                              onChange={() => updateFlightHotelField(item.id, "inputTimezoneCheckIn", "Europe/Prague")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-xs text-gray-700">🇨🇿 Prague</span>
                          </label>
                        </div>
                      </div>

                      {/* Timezone Display Mode Selector for Check-In */}
                      <div className="flex flex-col mt-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Show time to users as</label>
                        <div className="flex flex-col gap-1 mt-1">
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckInTzDisp-${item.id}`}
                              value="both"
                              checked={(item.details?.timezoneDisplayCheckIn || "both") === "both"}
                              onChange={() => updateFlightHotelField(item.id, "timezoneDisplayCheckIn", "both")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague + 🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckInTzDisp-${item.id}`}
                              value="prague"
                              checked={(item.details?.timezoneDisplayCheckIn || "both") === "prague"}
                              onChange={() => updateFlightHotelField(item.id, "timezoneDisplayCheckIn", "prague")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague only</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckInTzDisp-${item.id}`}
                              value="cairo"
                              checked={(item.details?.timezoneDisplayCheckIn || "both") === "cairo"}
                              onChange={() => updateFlightHotelField(item.id, "timezoneDisplayCheckIn", "cairo")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-750 font-semibold">🇪🇬 Cairo only</span>
                          </label>
                        </div>
                      </div>

                      {/* Live Preview for Check-In */}
                      {(() => {
                        const d = item.details?.checkInDate;
                        const t = item.details?.checkInTime;
                        const tz = item.details?.inputTimezoneCheckIn || "Africa/Cairo";
                        if (!d || !t) return null;
                        try {
                          const utc = localToUtc(`${d}T${t}`, tz);
                          const pDisp = utcToDisplay(utc, TZ_PRAGUE).time;
                          const cDisp = utcToDisplay(utc, TZ_CAIRO).time;
                          return (
                            <div className="text-[10px] bg-yellow-50/50 p-1.5 rounded border border-yellow-101/55 text-gray-650 font-semibold leading-normal flex flex-col justify-center mt-1">
                              <div>🇨🇿 PRG: <strong>{pDisp}</strong></div>
                              <div className="mt-0.5">🇪🇬 CAI: <strong>{cDisp}</strong></div>
                            </div>
                          );
                        } catch { return null; }
                      })()}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Check-Out Date
                      </label>
                      <input
                        type="date"
                        value={item.details?.checkOutDate || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "checkOutDate",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Check-Out Time
                      </label>
                      <input
                        type="time"
                        value={item.details?.checkOutTime || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "checkOutTime",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />

                      {/* Timezone Selector for Check-Out */}
                      <div className="flex flex-col mt-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Check-Out Timetimezone</label>
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckOutTz-${item.id}`}
                              value="Africa/Cairo"
                              checked={(item.details?.inputTimezoneCheckOut || "Africa/Cairo") === "Africa/Cairo"}
                              onChange={() => updateFlightHotelField(item.id, "inputTimezoneCheckOut", "Africa/Cairo")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-xs text-gray-700">🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckOutTz-${item.id}`}
                              value="Europe/Prague"
                              checked={(item.details?.inputTimezoneCheckOut || "Africa/Cairo") === "Europe/Prague"}
                              onChange={() => updateFlightHotelField(item.id, "inputTimezoneCheckOut", "Europe/Prague")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-xs text-gray-700">🇨🇿 Prague</span>
                          </label>
                        </div>
                      </div>

                      {/* Timezone Display Mode Selector for Check-Out */}
                      <div className="flex flex-col mt-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Show time to users as</label>
                        <div className="flex flex-col gap-1 mt-1">
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckOutTzDisp-${item.id}`}
                              value="both"
                              checked={(item.details?.timezoneDisplayCheckOut || "both") === "both"}
                              onChange={() => updateFlightHotelField(item.id, "timezoneDisplayCheckOut", "both")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague + 🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckOutTzDisp-${item.id}`}
                              value="prague"
                              checked={(item.details?.timezoneDisplayCheckOut || "both") === "prague"}
                              onChange={() => updateFlightHotelField(item.id, "timezoneDisplayCheckOut", "prague")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague only</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="radio"
                              name={`adminCheckOutTzDisp-${item.id}`}
                              value="cairo"
                              checked={(item.details?.timezoneDisplayCheckOut || "both") === "cairo"}
                              onChange={() => updateFlightHotelField(item.id, "timezoneDisplayCheckOut", "cairo")}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-750 font-semibold">🇪🇬 Cairo only</span>
                          </label>
                        </div>
                      </div>

                      {/* Live Preview for Check-Out */}
                      {(() => {
                        const d = item.details?.checkOutDate;
                        const t = item.details?.checkOutTime;
                        const tz = item.details?.inputTimezoneCheckOut || "Africa/Cairo";
                        if (!d || !t) return null;
                        try {
                          const utc = localToUtc(`${d}T${t}`, tz);
                          const pDisp = utcToDisplay(utc, TZ_PRAGUE).time;
                          const cDisp = utcToDisplay(utc, TZ_CAIRO).time;
                          return (
                            <div className="text-[10px] bg-yellow-50/50 p-1.5 rounded border border-yellow-101/55 text-gray-650 font-semibold leading-normal flex flex-col justify-center mt-1">
                              <div>🇨🇿 PRG: <strong>{pDisp}</strong></div>
                              <div className="mt-0.5">🇪🇬 CAI: <strong>{cDisp}</strong></div>
                            </div>
                          );
                        } catch { return null; }
                      })()}
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Hotel Full Address
                      </label>
                      <textarea
                        rows={2}
                        value={item.details?.address || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "address",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900 font-sans"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Google Maps coordinates/URL
                      </label>
                      <input
                        type="url"
                        value={item.details?.googleMapLocation || ""}
                        onChange={(e) =>
                          updateFlightHotelField(
                            item.id,
                            "googleMapLocation",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border border-gray-200 rounded mt-1 bg-white font-semibold text-gray-900"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex justify-end pt-5 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={handleSaveFlightHotelDetails}
            className="px-6 py-2.5 rounded bg-yellow-500 hover:bg-yellow-400 font-bold text-black border border-yellow-600 transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm"
          >
            💾 Save Flight & Hotel Details
          </button>
        </div>
      </div>

      {/* ── 3. SECTION B: TRIP SCHEDULE (tripSchedule.json) ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 mb-8 font-sans">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
            <span>🗓️</span> Section B: Trip Daily Itinerary (tripSchedule.json)
          </h3>
          <button
            type="button"
            onClick={handleAddTripDay}
            className="px-4 py-1.5 bg-black text-white hover:bg-gray-800 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            ➕ Add Day Card
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          This organizes the day-by-day agendas and activities rendered
          exclusively on the central Itinerary (Schedule) Tab.
        </p>

        <div className="space-y-6">
          {tripSchedule.map((day) => (
            <div
              key={day.id}
              className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50/50"
            >
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row items-center gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 w-full text-xs font-sans">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      Day Label
                    </label>
                    <input
                      type="text"
                      value={day.day || ""}
                      onChange={(e) =>
                        handleUpdateTripDayHeader(day.id, "day", e.target.value)
                      }
                      placeholder="e.g. Day 1"
                      className="w-full p-2 border border-gray-300 rounded bg-white text-xs mt-1 text-gray-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={day.date || ""}
                      onChange={(e) =>
                        handleUpdateTripDayHeader(
                          day.id,
                          "date",
                          e.target.value,
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded bg-white text-xs mt-1 text-gray-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      Theme / Title Description
                    </label>
                    <input
                      type="text"
                      value={day.title || ""}
                      onChange={(e) =>
                        handleUpdateTripDayHeader(
                          day.id,
                          "title",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Opening Day"
                      className="w-full p-2 border border-gray-300 rounded bg-white text-xs mt-1 text-gray-900 font-bold"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTripDay(day.id)}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-bold flex-shrink-0 self-end md:self-center cursor-pointer"
                >
                  ✕ Delete Day
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center bg-white border border-gray-105 p-2 rounded-lg">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                    Day Events ({day.events?.length || 0})
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAddTripEvent(day.id)}
                    className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-xs rounded transition-all cursor-pointer"
                  >
                    ➕ New Event
                  </button>
                </div>

                <div className="space-y-3">
                  {(day.events || []).map((event: any) => (
                    <div
                      key={event.id}
                      className="flex flex-col md:flex-row items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 w-full text-xs font-sans">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">
                            Time
                          </label>
                          <input
                            type="time"
                            value={event.time || ""}
                            onChange={(e) =>
                              handleUpdateTripEventField(
                                day.id,
                                event.id,
                                "time",
                                e.target.value,
                              )
                            }
                            className="w-full p-1.5 border border-gray-200 rounded bg-gray-50 font-semibold text-gray-905"
                          />

                          {/* Timezone Selector for Day Itinerary Event */}
                          <div className="flex flex-col mt-1">
                            <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Timezone</label>
                            <div className="flex gap-2">
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`tripEventTz-${event.id}`}
                                  value="Africa/Cairo"
                                  checked={(event.inputTimezone || "Africa/Cairo") === "Africa/Cairo"}
                                  onChange={() => handleUpdateTripEventField(day.id, event.id, "inputTimezone", "Africa/Cairo")}
                                  className="accent-yellow-500 w-3 h-3"
                                />
                                <span className="text-[10px] text-gray-700">🇪🇬 Cairo</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`tripEventTz-${event.id}`}
                                  value="Europe/Prague"
                                  checked={(event.inputTimezone || "Africa/Cairo") === "Europe/Prague"}
                                  onChange={() => handleUpdateTripEventField(day.id, event.id, "inputTimezone", "Europe/Prague")}
                                  className="accent-yellow-500 w-3 h-3"
                                />
                                <span className="text-[10px] text-gray-700">🇨🇿 Prague</span>
                              </label>
                            </div>
                          </div>

                          {/* Timezone Display Mode Selector for Daily Itinerary Event */}
                          <div className="flex flex-col mt-1">
                            <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Show time to users as</label>
                            <div className="flex flex-col gap-1 mt-1">
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`tripEventTzDisp-${event.id}`}
                                  value="both"
                                  checked={(event.timezoneDisplay || "both") === "both"}
                                  onChange={() => handleUpdateTripEventField(day.id, event.id, "timezoneDisplay", "both")}
                                  className="accent-yellow-500 w-3 h-3"
                                />
                                <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague + 🇪🇬 Cairo</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`tripEventTzDisp-${event.id}`}
                                  value="prague"
                                  checked={(event.timezoneDisplay || "both") === "prague"}
                                  onChange={() => handleUpdateTripEventField(day.id, event.id, "timezoneDisplay", "prague")}
                                  className="accent-yellow-500 w-3 h-3"
                                />
                                <span className="text-[10px] text-gray-750 font-semibold">🇨🇿 Prague only</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`tripEventTzDisp-${event.id}`}
                                  value="cairo"
                                  checked={(event.timezoneDisplay || "both") === "cairo"}
                                  onChange={() => handleUpdateTripEventField(day.id, event.id, "timezoneDisplay", "cairo")}
                                  className="accent-yellow-500 w-3 h-3"
                                />
                                <span className="text-[10px] text-gray-750 font-semibold">🇪🇬 Cairo only</span>
                              </label>
                            </div>
                          </div>

                          {/* Live Preview for Itinerary Event */}
                          {(() => {
                            const d = day.date;
                            const t = event.time;
                            const tz = event.inputTimezone || "Africa/Cairo";
                            if (!d || !t) return null;
                            try {
                              const utc = localToUtc(`${d}T${t}`, tz);
                              const pDisp = utcToDisplay(utc, TZ_PRAGUE).time;
                              const cDisp = utcToDisplay(utc, TZ_CAIRO).time;
                              return (
                                <div className="text-[9px] bg-yellow-50/40 p-1 rounded border border-yellow-105/50 text-gray-600 font-semibold leading-normal flex flex-col justify-center mt-1">
                                  <div>🇨🇿 PRG: <strong>{pDisp}</strong></div>
                                  <div className="mt-0.5">🇪🇬 CAI: <strong>{cDisp}</strong></div>
                                </div>
                              );
                            } catch { return null; }
                          })()}
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">
                            Label Description
                          </label>
                          <input
                            type="text"
                            value={event.label || ""}
                            onChange={(e) =>
                              handleUpdateTripEventField(
                                day.id,
                                event.id,
                                "label",
                                e.target.value,
                              )
                            }
                            className="w-full p-1.5 border border-gray-200 rounded bg-gray-50 font-semibold text-gray-905"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">
                              Icon
                            </label>
                            <input
                              type="text"
                              value={event.icon || ""}
                              onChange={(e) =>
                                handleUpdateTripEventField(
                                  day.id,
                                  event.id,
                                  "icon",
                                  e.target.value,
                                )
                              }
                              className="w-full p-1.5 border border-gray-200 rounded bg-gray-50 font-semibold text-center text-gray-905"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">
                              Type
                            </label>
                            <select
                              value={event.type || "session"}
                              onChange={(e) =>
                                handleUpdateTripEventField(
                                  day.id,
                                  event.id,
                                  "type",
                                  e.target.value,
                                )
                              }
                              className="w-full p-1.5 border border-gray-200 rounded bg-gray-50 font-semibold text-gray-905"
                            >
                              <option value="travel">Travel</option>
                              <option value="hotel">Hotel</option>
                              <option value="session">Session</option>
                              <option value="activity">Activity</option>
                              <option value="break">Break</option>
                            </select>
                          </div>
                        </div>

                        {/* Interactive Place, Maps, and Custom Action Buttons */}
                        <div className="col-span-full pt-2.5 mt-2 border-t border-dashed border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[8px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">
                              📍 Place / Location Name
                            </label>
                            <input
                              type="text"
                              value={event.location || ""}
                              onChange={(e) =>
                                handleUpdateTripEventField(day.id, event.id, "location", e.target.value)
                              }
                              placeholder="e.g. U Cedru Restaurant"
                              className="w-full p-1.5 border border-gray-200 rounded bg-gray-50 text-xs font-semibold text-gray-850"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">
                              🗺️ Google Maps URL
                            </label>
                            <input
                              type="text"
                              value={event.mapLocation || ""}
                              onChange={(e) =>
                                handleUpdateTripEventField(day.id, event.id, "mapLocation", e.target.value)
                              }
                              placeholder="e.g. https://maps.app.goo.gl/..."
                              className="w-full p-1.5 border border-gray-200 rounded bg-gray-50 text-xs font-semibold text-gray-850"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">
                              🔗 Custom Action Link
                            </label>
                            <input
                              type="text"
                              value={event.link || ""}
                              onChange={(e) =>
                                handleUpdateTripEventField(day.id, event.id, "link", e.target.value)
                              }
                              placeholder="e.g. Website URL"
                              className="w-full p-1.5 border border-gray-200 rounded bg-gray-50 text-xs font-semibold text-gray-850"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">
                              🏷️ Action Button Label
                            </label>
                            <input
                              type="text"
                              value={event.actionText || ""}
                              onChange={(e) =>
                                handleUpdateTripEventField(day.id, event.id, "actionText", e.target.value)
                              }
                              placeholder="Default: View Activity Details"
                              className="w-full p-1.5 border border-gray-200 rounded bg-gray-50 text-xs font-semibold text-gray-850"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTripEvent(day.id, event.id)}
                        className="px-2.5 py-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded text-xs font-bold cursor-pointer self-end md:self-center"
                      >
                        Delete
                      </button>
                    </div>
                  ))}

                  {(day.events || []).length === 0 && (
                    <p className="text-xs text-center p-3 text-gray-400 italic bg-white/40 border border-dashed rounded">
                      No events listed for this day.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {tripSchedule.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 font-bold">
              No Days configured. Click "Add Day Card" to begin.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-5 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={handleSaveTripSchedule}
            className="px-6 py-2.5 rounded bg-black text-white hover:bg-gray-800 font-bold transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm"
          >
            💾 Save Trip Schedule Agenda
          </button>
        </div>
      </div>
        </>
      )}

      {scheduleSubTab === "sessions" && (
        <div className="grid grid-cols-1 gap-8 animate-fade-in">
          {/* Sessions Manager */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-150">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">🎓 Sessions Manager</h3>
              <button
                onClick={handleAddSession}
                className="bg-black text-white hover:bg-gray-800 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm cursor-pointer"
              >
                + Add Session
              </button>
            </div>

            {/* DAY SELECTOR TOGGLE */}
            {(() => {
              const uniqueDays = Array.from(new Set(sessionItems.map((s: any) => (s.date || "") as string)))
                .filter(Boolean)
                .sort((a: string, b: string) => a.localeCompare(b));

              if (uniqueDays.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-50 rounded-lg border border-gray-150">
                  {uniqueDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedSessionDay(day)}
                      style={{ contentVisibility: 'auto' }}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        selectedSessionDay === day
                          ? "bg-white text-gray-950 border border-gray-250 shadow-sm font-black"
                          : "text-gray-550 hover:text-gray-900 font-medium"
                      }`}
                    >
                      📅 {day}
                    </button>
                  ))}
                </div>
              );
            })()}

            <div className="space-y-4">
              {sessionItems.length === 0 && (
                <p className="text-gray-400 text-center py-4">No sessions yet.</p>
              )}
              {sessionItems.length > 0 && (() => {
                const filtered = sessionItems
                  .filter((s) => !selectedSessionDay || s.date === selectedSessionDay)
                  .sort(
                    (a, b) =>
                      a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
                  );

                if (filtered.length === 0) {
                  return (
                    <p className="text-gray-450 text-center py-4 italic text-sm">
                      No sessions listed for this day.
                    </p>
                  );
                }

                return filtered.map((session: any) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col [@media(min-width:480px)]:flex-row justify-between items-start gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      {session.speakerPhoto ? (
                        <img 
                          src={session.speakerPhoto} 
                          alt={session.speaker}
                          className="w-14 h-14 rounded-full object-cover border border-gray-200 shadow-sm flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-sm shadow-sm flex-shrink-0 text-xl">
                          👤
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-bold text-sm sm:text-base">{session.title}</span>
                        <span className="text-xs text-blue-650 font-bold uppercase mt-1">
                          🗣 {session.speaker}
                        </span>
                        {session.speakerJob && (
                          <span className="text-xs text-gray-500 font-medium mt-0.5 whitespace-pre-wrap">
                            💼 {session.speakerJob}
                          </span>
                        )}
                        <div className="text-xs text-gray-500 mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1 font-bold text-gray-700">
                            📅 {session.date}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-gray-700">
                            ⏰ {formatTimeAmPm(session.time)}
                            {session.toTime ? ` - ${formatTimeAmPm(session.toTime)}` : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            🏛 {session.hall}
                          </span>
                          {(session.linkUrl || session.link) && (
                            <span className="text-blue-600 truncate max-w-[200px]">
                              🔗 {session.linkTitle ? session.linkTitle : (session.linkUrl || session.link)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end [@media(min-width:480px)]:self-start">
                      <button
                        onClick={() => handleEditSession(session)}
                        className="text-blue-650 text-xs font-bold p-1 py-1.5 px-3 border border-blue-200 rounded-lg bg-white hover:bg-blue-50 cursor-pointer shadow-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-red-650 text-xs font-bold p-1 py-1.5 px-3 border border-red-200 rounded-lg bg-white hover:bg-red-50 cursor-pointer shadow-sm"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal removed as per requirements */}

      {showSessionForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden">
            {/* STICKY HEADER */}
            <div className="flex items-center justify-between border-b px-6 py-4 border-gray-100 flex-shrink-0 bg-white">
              <h3 className="text-gray-900 font-bold text-lg">
                {editingSession ? "Edit Session" : "Add Session"}
              </h3>
              <button
                onClick={() => setShowSessionForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="text-gray-600 font-medium text-sm">Title</label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, title: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-gray-600 font-medium text-sm block">
                  Speaker
                </label>
                <input
                  type="text"
                  value={sessionForm.speaker}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, speaker: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-gray-600 font-medium text-sm block">
                  Speaker Job (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Professor of Urology"
                  value={sessionForm.speakerJob || ""}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, speakerJob: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-gray-600 font-medium text-sm block mb-1">
                  Speaker Photo (Optional)
                </label>
                {sessionForm.speakerPhoto ? (
                  <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <img
                      src={sessionForm.speakerPhoto}
                      alt="Speaker preview"
                      className="w-16 h-16 rounded-full object-cover border border-gray-300 shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        ✓ Photo Loaded
                      </p>
                      <p className="text-[10px] text-gray-400">Compressed Base64 Image</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSessionForm({ ...sessionForm, speakerPhoto: "" })}
                      className="text-xs text-red-600 font-bold hover:text-red-800 bg-red-50 hover:bg-red-105 px-2.5 py-1.5 rounded transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/")) {
                          alert("Please select a valid image file (JPG, PNG, WEBP).");
                          return;
                        }
                        const maxSize = 2 * 1024 * 1025; // 2MB
                        if (file.size > maxSize) {
                          alert("File is too large! Maximum limit is 2 MB.");
                          return;
                        }
                        try {
                          const compressed = await compressImage(file);
                          setSessionForm({ ...sessionForm, speakerPhoto: compressed });
                        } catch (err) {
                          alert("Error processing image.");
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-yellow-50 file:text-yellow-750 hover:file:bg-yellow-100 transition-all border border-gray-205 rounded-lg p-2.5 bg-gray-50"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-gray-600 font-medium text-sm">
                  Speaker WhatsApp contact number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +201234567890"
                  value={sessionForm.speakerWhatsApp || ""}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, speakerWhatsApp: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-gray-600 font-medium text-sm">Date</label>
                <input
                  type="date"
                  value={sessionForm.date}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, date: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 font-medium text-sm">
                    From Time
                  </label>
                  <input
                    type="time"
                    value={sessionForm.time}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, time: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium text-sm">
                    To Time
                  </label>
                  <input
                    type="time"
                    value={sessionForm.toTime}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, toTime: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-2 mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Timezone of this time
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inputTimezone_session"
                      value="Africa/Cairo"
                      checked={inputTimezone === "Africa/Cairo"}
                      onChange={() => setInputTimezone("Africa/Cairo")}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      🇪🇬 Cairo (EET UTC+3)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inputTimezone_session"
                      value="Europe/Prague"
                      checked={inputTimezone === "Europe/Prague"}
                      onChange={() => setInputTimezone("Europe/Prague")}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      🇨🇿 Prague (CEST UTC+2)
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Select the timezone the time above was given to you in. Default
                  is Cairo since you are based in Egypt.
                </p>

                {/* Timezone Display Mode Selector for Scientific Session */}
                <div className="flex flex-col gap-1 mt-3">
                  <label className="text-sm font-medium text-gray-700">
                    Show time to users as
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="sessionTzDisp"
                        value="both"
                        checked={(sessionForm.timezoneDisplay || "both") === "both"}
                        onChange={() => setSessionForm({ ...sessionForm, timezoneDisplay: "both" })}
                        className="accent-yellow-500 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">🇨🇿 Prague + 🇪🇬 Cairo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="sessionTzDisp"
                        value="prague"
                        checked={(sessionForm.timezoneDisplay || "both") === "prague"}
                        onChange={() => setSessionForm({ ...sessionForm, timezoneDisplay: "prague" })}
                        className="accent-yellow-500 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">🇨🇿 Prague only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="sessionTzDisp"
                        value="cairo"
                        checked={(sessionForm.timezoneDisplay || "both") === "cairo"}
                        onChange={() => setSessionForm({ ...sessionForm, timezoneDisplay: "cairo" })}
                        className="accent-yellow-500 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">🇪🇬 Cairo only</span>
                    </label>
                  </div>
                </div>

                {/* Live previews for scientific session */}
                {(() => {
                  const d = sessionForm.date;
                  const tFrom = sessionForm.time;
                  const tTo = sessionForm.toTime;
                  const tz = inputTimezone || "Africa/Cairo";
                  if (!d) return null;
                  
                  const fromPrague = (() => {
                    if (!tFrom) return "";
                    try {
                      const utc = localToUtc(`${d}T${tFrom}`, tz);
                      return utcToDisplay(utc, TZ_PRAGUE).time;
                    } catch { return ""; }
                  })();
                  const fromCairo = (() => {
                    if (!tFrom) return "";
                    try {
                      const utc = localToUtc(`${d}T${tFrom}`, tz);
                      return utcToDisplay(utc, TZ_CAIRO).time;
                    } catch { return ""; }
                  })();

                  const toPrague = (() => {
                    if (!tTo) return "";
                    try {
                      const utc = localToUtc(`${d}T${tTo}`, tz);
                      return utcToDisplay(utc, TZ_PRAGUE).time;
                    } catch { return ""; }
                  })();
                  const toCairo = (() => {
                    if (!tTo) return "";
                    try {
                      const utc = localToUtc(`${d}T${tTo}`, tz);
                      return utcToDisplay(utc, TZ_CAIRO).time;
                    } catch { return ""; }
                  })();

                  if (!fromPrague && !toPrague) return null;

                  return (
                    <div className="flex flex-col gap-1 px-3 py-2 mt-2 bg-yellow-50 rounded-lg border border-yellow-250 text-xs text-gray-700 font-semibold leading-normal">
                      {fromPrague && fromCairo && (
                        <div>
                          🏁 Start: 🇨🇿 Prague: <strong>{fromPrague}</strong> | 🇪🇬 Cairo: <strong>{fromCairo}</strong>
                        </div>
                      )}
                      {toPrague && toCairo && (
                        <div className="border-t border-yellow-200/50 pt-1 mt-1">
                          🛑 End: 🇨🇿 Prague: <strong>{toPrague}</strong> | 🇪🇬 Cairo: <strong>{toCairo}</strong>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-gray-600 font-medium text-sm">
                  Hall / Location
                </label>
                <input
                  type="text"
                  value={sessionForm.hall}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, hall: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-gray-600 font-medium text-sm block">
                  Session Link URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={sessionForm.linkUrl || sessionForm.link || ""}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, linkUrl: e.target.value, link: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-gray-650 font-medium text-xs block">
                  Link Display Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Join Webinar, View Document"
                  value={sessionForm.linkTitle || ""}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, linkTitle: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-xs"
                />
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 rounded-b-xl">
              <button
                type="button"
                disabled={isSavingSession}
                onClick={() => setShowSessionForm(false)}
                className="px-5 py-2 rounded-lg bg-white border border-gray-300 shadow-sm text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingSession}
                onClick={handleSaveSession}
                className="px-5 py-2 rounded-lg bg-yellow-500 border border-yellow-600 shadow-sm text-gray-900 font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSavingSession ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2005/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const FEATURES = [
    {
      key: "sessions",
      label: "Sessions",
      icon: "🎓",
      desc: "Scientific conference sessions",
    },
    {
      key: "schedule",
      label: "Schedule",
      icon: "📅",
      desc: "Trip and conference schedule",
    },
    {
      key: "photoGallery",
      label: "Photo Gallery",
      icon: "📷",
      desc: "Conference photo gallery",
    },
  ];

  async function handleApplyRoleGlobal() {
    const { role, feature, status } = roleGlobalConfig;
    if (
      !confirm(
        `Apply ${status.replace("_", " ")} status for ${feature} to ALL users with the role "${role}"?`,
      )
    )
      return;

    try {
      setIsGlobalLoading(true);
      const statusMap: any = {
        active: { access: true, status: "full" },
        coming_soon: { access: true, status: "coming_soon" },
        disabled: { access: false, status: "coming_soon" },
      };

      const newStatus = statusMap[status];
      const updatedUsers = users.map((u) => {
        if (u.role === role) {
          return {
            ...u,
            featureAccess: {
              ...(u.featureAccess || {}),
              [feature]: newStatus,
            },
          };
        }
        return u;
      });

      await writeJSON("users.json", updatedUsers);
      updateUsers(updatedUsers);
      showToast(`Finished applying status to all ${role}s ✓`, "success");
    } catch (e) {
      showToast("Failed to apply role global settings", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  }

  const renderTab4 = () => {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Feature & Access Control</h2>

        {/* New Role Global Settings Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8 border border-yellow-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🚀</span>
            <h3 className="font-bold text-lg">Role Global Settings</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Apply a feature status to entire roles at once.
          </p>

          <div className="flex flex-col md:flex-row items-end gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                Target Role
              </label>
              <select
                value={roleGlobalConfig.role}
                onChange={(e) =>
                  setRoleGlobalConfig({
                    ...roleGlobalConfig,
                    role: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-yellow-500 outline-none"
              >
                <option value="doctor">Doctor</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                Feature
              </label>
              <select
                value={roleGlobalConfig.feature}
                onChange={(e) =>
                  setRoleGlobalConfig({
                    ...roleGlobalConfig,
                    feature: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-yellow-500 outline-none"
              >
                {FEATURES.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                New Status
              </label>
              <select
                value={roleGlobalConfig.status}
                onChange={(e) =>
                  setRoleGlobalConfig({
                    ...roleGlobalConfig,
                    status: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-yellow-500 outline-none"
              >
                <option value="active">Active</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <button
                onClick={handleApplyRoleGlobal}
                className="w-full bg-black text-white font-bold py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
              >
                Apply to all {roleGlobalConfig.role}s
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-6 mb-8">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-bold text-lg">🌍 Global Feature Flags</h3>
            <button
              onClick={handleSaveGlobalFeatures}
              disabled={isSavingFeatures}
              className="bg-yellow-500 text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-400 border border-yellow-600 shadow-sm disabled:opacity-50"
            >
              {isSavingFeatures ? "Saving..." : "Save Global Features"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.key}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <p className="text-gray-900 font-semibold">
                      {feature.label}
                    </p>
                    <p className="text-gray-500 text-xs">{feature.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={featureSettings[feature.key] || "active"}
                    onChange={(e) =>
                      setFeatureSettings({
                        ...featureSettings,
                        [feature.key]: e.target.value,
                      })
                    }
                    className="bg-white border border-gray-300 text-gray-900 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-yellow-500"
                  >
                    <option value="active">Active</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-3 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg max-w-max mx-auto shadow-sm hover:bg-yellow-100 transition-colors">
            <input
              type="checkbox"
              checked={applyFeaturesToAllUsers}
              onChange={(e) => setApplyFeaturesToAllUsers(e.target.checked)}
              className="accent-yellow-500 w-5 h-5"
            />
            <span className="font-bold text-sm">
              Apply global feature settings to ALL users
            </span>
          </label>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-bold text-lg">👤 Per-User Feature Overrides</h3>
            <select
              value={selectedFeatureUser}
              onChange={(e) => setSelectedFeatureUser(e.target.value)}
              className="p-2 border border-gray-300 rounded font-semibold min-w-[200px] outline-none focus:ring-1 focus:ring-yellow-500 bg-white"
            >
              <option value="">-- Select User --</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {selectedFeatureUser ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURES.map((feature) => {
                  const access = userFeatureAccess[feature.key];
                  const isEnabled = access !== false && access !== undefined;
                  const status =
                    typeof access === "string"
                      ? access
                      : access?.status || "full";

                  return (
                    <div
                      key={feature.key}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{feature.icon}</span>
                          <div>
                            <p className="text-gray-900 font-medium">
                              {feature.label}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {feature.desc}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setUserFeatureAccess({
                              ...userFeatureAccess,
                              [feature.key]: isEnabled ? false : "full",
                            })
                          }
                          className={`relative w-12 h-6 rounded-full transition-colors border ${isEnabled ? "bg-yellow-500 border-yellow-600" : "bg-gray-200 border-gray-300"}`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${isEnabled ? "translate-x-7" : "translate-x-1"}`}
                          />
                        </button>
                      </div>
                      {isEnabled && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-gray-500 text-xs">Status:</span>
                          <select
                            value={status}
                            onChange={(e) =>
                              setUserFeatureAccess({
                                ...userFeatureAccess,
                                [feature.key]: e.target.value,
                              })
                            }
                            className="bg-white border border-gray-300 text-gray-900 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-yellow-500"
                          >
                            <option value="full">Full Access</option>
                            <option value="coming_soon">Coming Soon</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveUserFeatureAccess}
                  disabled={isSavingFeatures}
                  className="bg-yellow-500 text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-400 border border-yellow-600 shadow-sm disabled:opacity-50"
                >
                  {isSavingFeatures ? "Saving..." : "Save User Overrides"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Select a user above to modify their access overrides.
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- TAB 5 METHODS (Media) ---
  const handleAddMedia = () => {
    setEditingMediaPost(null);
    setShowMediaModal(true);
  };

  const handleEditMedia = (post: any) => {
    setEditingMediaPost(post);
    setShowMediaModal(true);
  };

  const handleSaveMedia = async (postForm: any) => {
    try {
      setIsGlobalLoading(true);
      let updated: any[];
      if (editingMediaPost) {
        updated = media.map((m) =>
          m.id === editingMediaPost.id
            ? { ...postForm, id: editingMediaPost.id }
            : m,
        );
      } else {
        updated = [...media, { ...postForm, id: "p" + Date.now() }];
      }
      await writeJSON("media.json", updated);
      updateMedia(updated);
      showToast("Media post saved successfully ✓", "success");
    } catch (e) {
      showToast("Failed to save media", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Delete this media post?")) return;
    try {
      setIsGlobalLoading(true);
      const updated = media.filter((m) => m.id !== id);
      await writeJSON("media.json", updated);
      updateMedia(updated);
      showToast("Media deleted successfully", "success");
    } catch (e) {
      showToast("Delete failed", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const renderTab5 = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🖼️</span> Media / Posts
          </h2>
          <button
            onClick={handleAddMedia}
            className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 shadow-sm transition-all"
          >
            + Create Post
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {media.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-10">
              No posts. Create one to get started.
            </p>
          )}
          {media.map((post: any) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group h-full hover:shadow-md transition-all"
            >
              <div className="relative aspect-video bg-gray-200">
                <img
                  src={post.imageDataUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleEditMedia(post)}
                    className="p-2 bg-white text-blue-600 rounded-lg shadow hover:bg-blue-50"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteMedia(post.id)}
                    className="p-2 bg-white text-red-600 rounded-lg shadow hover:bg-red-50"
                  >
                    🗑
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
                    {post.category}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {new Date(
                      post.createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                  {post.caption || "No caption provided."}
                </p>

                {/* Status & Audience Badges */}
                <div className="mt-auto">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {post.comingSoon && (
                      <span className="text-[9px] bg-yellow-400 text-black px-2 py-1 flex items-center justify-center font-black rounded uppercase tracking-tighter shadow-sm border border-yellow-500">
                        🕐 Coming Soon
                      </span>
                    )}
                    {post.scheduledAt && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-1 flex items-center justify-center font-black rounded uppercase tracking-tighter shadow-sm border border-blue-200">
                        📅{" "}
                        {new Date(post.scheduledAt).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                    <div className="px-2 py-1 bg-[#FFBF00] text-black text-[9px] font-black rounded inline-flex items-center gap-1 uppercase tracking-tighter shadow-sm border border-yellow-600/20">
                      {(!post.audienceType || post.audienceType === "all") && (
                        <>🌍 All Users</>
                      )}
                      {post.audienceType === "roles" && (
                        <>👥 Roles: {(post.audienceRoles || []).join(", ")}</>
                      )}
                      {post.audienceType === "users" && (
                        <>
                          👤 {(post.audienceUserIds || []).length} Specific
                          Users
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showMediaModal && (
          <MediaPostModal
            isOpen={showMediaModal}
            onClose={() => setShowMediaModal(false)}
            onSave={handleSaveMedia}
            post={editingMediaPost}
          />
        )}

        <AdminGalleries />
      </div>
    );
  };

  const renderTab6 = () => {
    const schedCats =
      settings?.scheduleCategories || DEFAULT_SCHEDULE_CATEGORIES;
    const medCats = settings?.mediaCategories || DEFAULT_MEDIA_CATEGORIES;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(isSavingCats || isGlobalLoading) && (
          <div className="fixed inset-0 z-[100] bg-black/40 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
            <p className="text-white font-bold">Saving categories...</p>
          </div>
        )}

        {/* Schedule Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>📅</span> Schedule Categories
          </h3>
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
            {schedCats.map((cat: string) => (
              <div
                key={cat}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
              >
                <span className="font-bold text-gray-700">{cat}</span>
                <button
                  onClick={() => handleDeleteCategory("schedule", cat)}
                  className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New Schedule Category"
              value={newSchedCat}
              onChange={(e) => setNewSchedCat(e.target.value)}
              className="flex-1 p-2 border rounded focus:ring-1 focus:ring-yellow-500 outline-none"
            />
            <button
              onClick={() => handleAddCategory("schedule")}
              className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800"
            >
              Add
            </button>
          </div>
        </div>

        {/* Gallery Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>🖼️</span> Gallery Categories
          </h3>
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
            {medCats.map((cat: string) => (
              <div
                key={cat}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
              >
                <span className="font-bold text-gray-700">{cat}</span>
                <button
                  onClick={() => handleDeleteCategory("media", cat)}
                  className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New Gallery Category"
              value={newMediaCat}
              onChange={(e) => setNewMediaCat(e.target.value)}
              className="flex-1 p-2 border rounded focus:ring-1 focus:ring-yellow-500 outline-none"
            />
            <button
              onClick={() => handleAddCategory("media")}
              className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800"
            >
              Add
            </button>
          </div>
        </div>

        {/* Global App Version Settings Board */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 col-span-1 md:col-span-2">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            <span>⚙️</span> Global Application Version
          </h3>
          <p className="text-gray-500 text-xs mb-4">
            Manage the user-facing application build version displayed in the footers and system logs in real-time.
          </p>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="e.g. 1.0.957"
              value={inputAppVersion}
              onChange={(e) => setInputAppVersion(e.target.value)}
              className="flex-1 p-2 border rounded focus:ring-1 focus:ring-yellow-500 outline-none font-semibold text-gray-800"
            />
            <button
              onClick={handleSaveAppVersion}
              disabled={isSavingVersion}
              className="bg-yellow-500 text-black px-6 py-2 rounded font-bold hover:bg-yellow-600 disabled:opacity-50 transition-colors"
            >
              {isSavingVersion ? "Saving..." : "Save Version"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      {/* Admin Version Badge */}
      <div className="mb-6 flex justify-between items-center bg-black p-4 rounded-xl shadow-lg border border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Admin Control Panel
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            Management Suite
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-black shadow-sm">
            v{settings?.appVersion || APP_VERSION}
          </span>
          <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">
            Current Build
          </span>
        </div>
      </div>

      {/* Global Saving Overlay */}
      {isGlobalLoading && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500 border-t-transparent"></div>
          <p className="text-white font-bold text-xl drop-shadow-md">
            Saving changes...
          </p>
        </div>
      )}

      {/* Mobile: Tab Dropdown Selection */}
      <div className="md:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full border-2 border-yellow-400 rounded-lg px-4 py-2.5
                     text-sm font-bold text-gray-900 bg-white
                     focus:outline-none focus:ring-2 focus:ring-yellow-400
                     appearance-none cursor-pointer"
        >
          <option value="dashboard">📊 Quick Panel</option>
          <option value="users">👥 User Management</option>
          <option value="messages">💬 Message Center</option>
          <option value="appConfig">⚙️ App Settings</option>
          <option value="tripInfo">{"\u2708\uFE0F"} Trip Info</option>
          <option value="schedule">📅 Schedule & Sessions</option>
          <option value="features">🚀 Feature Flags</option>
          <option value="media">🖼️ Media / Posts</option>
          <option value="categories">🎨 Categories</option>
          <option value="pageSettings">🔒 Page Access</option>
          <option value="checkins">✅ Check-ins Manager</option>
        </select>
      </div>

      {/* Desktop/Tablet: Horizontal Tab Bar */}
      <div className="hidden md:flex mb-6 gap-2 border-b overflow-x-auto overflow-y-hidden whitespace-nowrap overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch] pb-[1px]">
        {[
          { key: "dashboard", label: "📊 Quick Panel" },
          { key: "users", label: "👥 User Management" },
          { key: "messages", label: "💬 Message Center" },
          { key: "appConfig", label: "⚙️ App Settings" },
          { key: "tripInfo", label: '{"\u2708\uFE0F"} Trip Info' },
          { key: "schedule", label: "📅 Schedule & Sessions" },
          { key: "features", label: "🚀 Feature Flags" },
          { key: "media", label: "🖼️ Media / Posts" },
          { key: "categories", label: "🎨 Categories" },
          { key: "pageSettings", label: "🔒 Page Access" },
          { key: "checkins", label: "✅ Check-ins" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-6 font-bold whitespace-nowrap border-b-4 transition-colors ${
              activeTab === tab.key
                ? "border-yellow-500 text-black"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pb-12">
        {activeTab === "dashboard" && (
          <AdminDashboard onSelectTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === "users" && renderTab1()}
        {activeTab === "messages" && <AdminMessages />}
        {activeTab === "appConfig" && renderAppConfigTab()}
        {activeTab === "tripInfo" && renderTripInfoTab()}
        {activeTab === "schedule" && renderTab3()}
        {activeTab === "features" && renderTab4()}
        {activeTab === "media" && renderTab5()}
        {activeTab === "categories" && renderTab6()}
        {activeTab === "pageSettings" && <SettingsTab />}
        {activeTab === "checkins" && <AdminCheckinsTab />}
      </div>
    </Layout>
  );
}
