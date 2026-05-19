/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, DragEvent } from 'react';
import Layout from '../components/Layout';
import { useApp, DEFAULT_SCHEDULE_CATEGORIES, DEFAULT_MEDIA_CATEGORIES } from '../context/AppContext';
import { APP_VERSION } from "../version";
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { writeJSON } from '../utils/github';
import UserControlCard from '../components/UserControlCard';
import UserGridCard from '../components/UserGridCard';
import UserAvatar from '../components/UserAvatar';
import MediaPostViewerModal from '../components/MediaPostViewerModal';
import MediaPostModal from '../components/MediaPostModal';
import { showToast } from '../components/Toast';
import { compressImage } from '../utils/image';

export default function Admin() {
  const { 
    currentUser, users, schedule, sessions, settings, media = [], tripInfo, appConfig,
    updateUsers, updateSchedule, updateSessions, updateSettings, updateMedia, updateTripInfo, updateAppConfig
  } = useApp();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "users";
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

  // Tab 3 State (Schedule & Sessions)
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
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

  const [sessionItems, setSessionItems] = useState<any[]>([]);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    id: "",
    title: "",
    speaker: "",
    date: "",
    time: "",
    toTime: "",
    hall: "",
    link: "",
  });

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
    status: "active"
  });
  const [editingMediaPost, setEditingMediaPost] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // Tab 6 State (Categories)
  const [newSchedCat, setNewSchedCat] = useState("");
  const [newMediaCat, setNewMediaCat] = useState("");
  const [isSavingCats, setIsSavingCats] = useState(false);

  // App Settings Tab state
  const [navLabelsForm, setNavLabelsForm] = useState<Record<string, string>>(() => (appConfig?.navLabels || {
    dashboard: "Home Page",
    schedule: "Trip Schedule",
    sessions: "Sessions",
    media: "News Feed",
    directory: "Staff Directory",
    profile: "My Profile"
  }));

  const [pageConfigs, setPageConfigs] = useState<Record<string, any>>(() => (appConfig?.pages || {
    directory: { visible: true, comingSoon: false },
    media: { visible: true, comingSoon: false }
  }));

  const [navOrder, setNavOrder] = useState<string[]>(() => (appConfig?.navOrder || [
    "dashboard",
    "schedule",
    "sessions",
    "media",
    "directory",
    "profile"
  ]));

  useEffect(() => {
    if (appConfig?.navLabels) setNavLabelsForm(appConfig.navLabels);
    if (appConfig?.pages) setPageConfigs(appConfig.pages);
    if (appConfig?.navOrder) setNavOrder(appConfig.navOrder);
  }, [appConfig]);

  const handleAppConfigSave = async () => {
    setIsGlobalLoading(true);
    try {
      const newConfig = { ...appConfig, navLabels: navLabelsForm };
      await writeJSON('appConfig.json', newConfig);
      updateAppConfig(newConfig);
      showToast('Navigation labels successfully saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleSaveNavOrder = async () => {
    setIsGlobalLoading(true);
    try {
      const updated = {
        ...appConfig,
        navOrder: navOrder
      };
      await writeJSON('appConfig.json', updated);
      updateAppConfig(updated);
      showToast("Navigation order successfully saved!", "success");
    } catch (err: any) {
      showToast(err.message || 'Failed to save navigation order', 'error');
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleSavePageSettings = async () => {
    setIsGlobalLoading(true);
    try {
      const updated = {
        ...appConfig,
        pages: pageConfigs
      };
      await writeJSON('appConfig.json', updated);
      updateAppConfig(updated);
      showToast("Page settings successfully saved!", "success");
    } catch (err: any) {
      showToast(err.message || 'Failed to save page settings', 'error');
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const renderAppConfigTab = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>⚙️</span> Navigation Menu Labels</h2>
        <p className="text-sm text-gray-500 mb-6 font-medium">Rename your sidebar navigation items. Changes reflect for all users instantly.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
          {[
            { key: 'dashboard', id: 'Dashboard Key' },
            { key: 'schedule', id: 'Schedule Key' },
            { key: 'sessions', id: 'Sessions Key' },
            { key: 'media', id: 'Media Key' },
            { key: 'directory', id: 'Directory Key' },
            { key: 'profile', id: 'Profile Key' }
          ].map(item => (
            <div key={item.key} className="flex flex-col">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{item.id}</label>
              <input 
                type="text" 
                className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none transition-all font-bold text-gray-900 bg-white" 
                value={navLabelsForm[item.key] || ""}
                onChange={e => setNavLabelsForm(p => ({...p, [item.key]: e.target.value}))}
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

      {/* Page Visibility & Status section */}
      <div className="pt-8 border-t border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>🛡️</span> Page Visibility & Status</h2>
        <p className="text-sm text-gray-500 mb-6 font-medium">Control whether specific sections of the app are visible to end users or flagged as coming soon.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(pageConfigs).map(([pageKey, config]: [string, any]) => (
            <div key={pageKey} className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex flex-col gap-4">
              <p className="font-bold text-gray-800 capitalize text-sm tracking-wider uppercase">
                {pageKey === "directory" ? "Staff Directory" : "News Feed (Media)"}
              </p>

              {/* Visible toggle */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-500 w-20 uppercase tracking-wider">Visible:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`visible-${pageKey}`}
                    checked={config.visible === true}
                    onChange={() => setPageConfigs(p => ({
                      ...p,
                      [pageKey]: { ...p[pageKey], visible: true }
                    }))}
                    className="accent-yellow-400 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700 font-medium">Show</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`visible-${pageKey}`}
                    checked={config.visible === false}
                    onChange={() => setPageConfigs(p => ({
                      ...p,
                      [pageKey]: { ...p[pageKey], visible: false }
                    }))}
                    className="accent-yellow-400 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700 font-medium">Hide</span>
                </label>
              </div>

              {/* Coming Soon toggle */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-500 w-20 uppercase tracking-wider">Status:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`soon-${pageKey}`}
                    checked={config.comingSoon === false}
                    onChange={() => setPageConfigs(p => ({
                      ...p,
                      [pageKey]: { ...p[pageKey], comingSoon: false }
                    }))}
                    className="accent-yellow-400 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700 font-medium">Live</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`soon-${pageKey}`}
                    checked={config.comingSoon === true}
                    onChange={() => setPageConfigs(p => ({
                      ...p,
                      [pageKey]: { ...p[pageKey], comingSoon: true }
                    }))}
                    className="accent-yellow-400 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700 font-medium">Coming Soon</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSavePageSettings}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-xl transition duration-200 outline-none shadow-md cursor-pointer"
          >
            Save Page Settings
          </button>
        </div>
      </div>

      {/* Sidebar Navigation Order (Drag-to-Reorder & Up/Down Buttons) */}
      <div className="pt-8 border-t border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>📂</span> Sidebar Navigation Order</h2>
        <p className="text-sm text-gray-500 mb-6 font-medium font-sans">
          Reorder the sidebar navigation links. Drag and drop items into your preferred sequence, or use the <strong>▲ Up</strong> / <strong>▼ Down</strong> buttons. Click <strong>Save Order</strong> to apply changes.
        </p>

        <div className="max-w-md space-y-2">
          {navOrder.map((key, index) => {
            // Retrieve label from labels form or fall back to standard labels
            const label = navLabelsForm[key] || {
              dashboard: "Home Page",
              schedule: "Trip Schedule",
              sessions: "Sessions",
              media: "News Feed",
              directory: "Staff Directory",
              profile: "My Profile"
            }[key] || key;

            // Simple map of icons corresponding to each key
            const icon = {
              dashboard: "🏠",
              schedule: "📅",
              sessions: "🎓",
              media: "🖼️",
              directory: "👥",
              profile: "👤"
            }[key] || "📍";

            // HTML5 Drag-and-drop Handlers
            const handleDragStart = (e: DragEvent) => {
              e.dataTransfer.setData("text/plain", index.toString());
            };

            const handleDragOver = (e: DragEvent) => {
              e.preventDefault();
            };

            const handleDrop = (e: DragEvent) => {
              const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
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
                  <span className="text-gray-400 select-none cursor-grab">⠿</span>
                  <span className="text-xl">{icon}</span>
                  <span className="font-bold text-gray-800 text-sm">{label}</span>
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
  const [tripInfoForm, setTripInfoForm] = useState(() => (tripInfo || {
    hotel: { name: "", mapUrl: "" },
    departure: { flightNumber: "", date: "", terminal: "" },
    arrival: { flightNumber: "", date: "", terminal: "" }
  }));

  useEffect(() => {
    if (tripInfo) setTripInfoForm(tripInfo);
  }, [tripInfo]);

  const handleTripInfoSave = async () => {
    setIsGlobalLoading(true);
    try {
      await writeJSON('tripInfo.json', tripInfoForm);
      updateTripInfo(tripInfoForm);
      showToast('Trip Info successfully saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const renderTripInfoTab = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>🏨</span> Global Hotel Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Hotel Name</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={tripInfoForm.hotel.name}
              onChange={e => setTripInfoForm(p => ({...p, hotel: {...p.hotel, name: e.target.value}}))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Hotel Map URL</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={tripInfoForm.hotel.mapUrl}
              onChange={e => setTripInfoForm(p => ({...p, hotel: {...p.hotel, mapUrl: e.target.value}}))}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>🛫</span> Global Departure Flight</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Flight Number</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={tripInfoForm.departure.flightNumber}
              onChange={e => setTripInfoForm(p => ({...p, departure: {...p.departure, flightNumber: e.target.value}}))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Date</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={tripInfoForm.departure.date}
              onChange={e => setTripInfoForm(p => ({...p, departure: {...p.departure, date: e.target.value}}))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Terminal</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={tripInfoForm.departure.terminal}
              onChange={e => setTripInfoForm(p => ({...p, departure: {...p.departure, terminal: e.target.value}}))}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>🛬</span> Global Return Flight</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Flight Number</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={tripInfoForm.arrival.flightNumber}
              onChange={e => setTripInfoForm(p => ({...p, arrival: {...p.arrival, flightNumber: e.target.value}}))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Date</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={tripInfoForm.arrival.date}
              onChange={e => setTripInfoForm(p => ({...p, arrival: {...p.arrival, date: e.target.value}}))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Terminal</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={tripInfoForm.arrival.terminal}
              onChange={e => setTripInfoForm(p => ({...p, arrival: {...p.arrival, terminal: e.target.value}}))}
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
      setScheduleItems(schedule);
    }
  }, [schedule]);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setSessionItems(sessions);
    }
  }, [sessions]);

  useEffect(() => {
    if (settings) {
      setFeatureSettings(settings?.globalFeatures || {
        sessions: "active",
        schedule: "active",
        photoGallery: "coming_soon",
      });
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
  const handleAddCategory = async (type: 'schedule' | 'media') => {
    const val = type === 'schedule' ? newSchedCat.trim() : newMediaCat.trim();
    if (!val) return;

    const key = type === 'schedule' ? 'scheduleCategories' : 'mediaCategories';
    const current = settings?.[key] || (type === 'schedule' ? ["Scientific", "Social", "Transport", "Other"] : ["Conference", "Social", "Tours", "Awards"]);
    
    if (current.includes(val)) {
      showToast("Category already exists", "error");
      return;
    }

    try {
      setIsSavingCats(true);
      const updatedSettings = {
        ...settings,
        [key]: [...current, val]
      };
      await writeJSON("settings.json", updatedSettings);
      updateSettings(updatedSettings);
      if (type === 'schedule') setNewSchedCat("");
      else setNewMediaCat("");
      showToast("Category added", "success");
    } catch (e) {
      showToast("Failed to add category", "error");
    } finally {
      setIsSavingCats(false);
    }
  };

  const handleDeleteCategory = async (type: 'schedule' | 'media', cat: string) => {
    // Check if in use
    let inUse = false;
    if (type === 'schedule') {
      inUse = schedule.some(day => day.items?.some((i: any) => i.category === cat));
    } else {
      inUse = media.some(m => m.category === cat);
    }

    if (inUse) {
      alert(`Category "${cat}" is currently in use and cannot be deleted.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${cat}"?`)) return;

    const key = type === 'schedule' ? 'scheduleCategories' : 'mediaCategories';
    const current = settings?.[key] || [];

    try {
      setIsSavingCats(true);
      const updatedSettings = {
        ...settings,
        [key]: current.filter((c: string) => c !== cat)
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

  // --- TAB 1 METHODS ---
  const handleSaveUser = async (updatedUser: any, applyToAllTravel: boolean = false, applyFeaturesToAll: boolean = false, applyFieldsToAll: boolean = false) => {
    let newUsers;
    if (editingUser) {
      newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    } else {
      newUsers = [...users, updatedUser];
    }

    if (applyToAllTravel) {
      if (confirm("Are you sure you want to apply these travel & hotel details to ALL users?")) {
        newUsers = newUsers.map(u => ({
          ...u,
          flightDetails: updatedUser.flightDetails,
          hotel: updatedUser.hotel,
          transfers: updatedUser.transfers
        }));
      }
    }

    if (applyFeaturesToAll || applyFieldsToAll) {
      if (confirm("Are you sure you want to apply these settings to ALL users?")) {
          newUsers = newUsers.map(u => ({
              ...u,
              ...(applyFeaturesToAll ? { featureAccess: updatedUser.featureAccess } : {}),
              ...(applyFieldsToAll ? { visibleFields: updatedUser.visibleFields } : {})
          }));
      }
    }

    await writeJSON('users.json', newUsers);
    updateUsers(newUsers);
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?\nThis action cannot be undone.")) {
      const newUsers = users.filter((u: any) => u.id !== id);
      try {
        await writeJSON('users.json', newUsers);
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
        accessUserIds: item.accessUserIds || [] 
    });
  }

  async function handleSaveSchedule() {
    if (!scheduleForm.activity || !scheduleForm.date || !scheduleForm.time) {
        showToast("Activity, Date and Time are required", "error");
        return;
    }

    try {
      setIsGlobalLoading(true);
      let updated: any[];
      if (applyToAllSchedule) {
        if (!confirm("Are you sure you want to apply these details to ALL schedule items?")) {
            setIsGlobalLoading(false);
            return;
        }
        updated = scheduleItems.map(day => ({
          ...day,
          items: day.items?.map((i: any) => ({
            ...i,
            date: scheduleForm.date,
            time: scheduleForm.time,
            location: scheduleForm.location,
            link: scheduleForm.link,
            mapLocation: scheduleForm.mapLocation,
            notes: scheduleForm.notes,
            accessRoles: scheduleForm.accessRoles,
            accessUserIds: scheduleForm.accessUserIds
          })) || []
        }));
      } else if (editingScheduleId && editingScheduleId !== "new") {
        updated = scheduleItems.map(day => ({
          ...day,
          items: day.items?.map((i: any) => i.id === editingScheduleId ? { ...scheduleForm } : i) || []
        }));
        
        // If the date was changed, we might need to move it to another day container
        const currentItem = scheduleForm;
        const originalDay = scheduleItems.find(d => d.items?.some((i: any) => i.id === editingScheduleId));
        
        if (originalDay && originalDay.date !== currentItem.date) {
            // Remove from old day
            updated = updated.map(d => ({
                ...d,
                items: d.items.filter((i: any) => i.id !== editingScheduleId)
            })).filter(d => d.items.length > 0);
            
            // Add to new day
            const dayIdx = updated.findIndex(d => d.date === currentItem.date);
            if (dayIdx >= 0) {
                updated[dayIdx] = { ...updated[dayIdx], items: [...updated[dayIdx].items, currentItem] };
            } else {
                updated.push({ id: 'd' + Date.now(), date: currentItem.date, title: "Schedule", items: [currentItem] });
            }
        }
      } else {
        // Find existing day or create new
        const dayIdx = scheduleItems.findIndex(d => d.date === scheduleForm.date);
        updated = [...scheduleItems];
        if (dayIdx >= 0) {
          updated[dayIdx] = { ...updated[dayIdx], items: [...(updated[dayIdx].items || []), { ...scheduleForm }] };
        } else {
          updated.push({ id: 'd' + Date.now(), date: scheduleForm.date, title: "Schedule", items: [{ ...scheduleForm }] });
        }
      }
      
      // Sort items by time within days
      updated = updated.map(day => ({
          ...day,
          items: [...day.items].sort((a, b) => a.time.localeCompare(b.time))
      })).sort((a, b) => a.date.localeCompare(b.date));

      setScheduleItems(updated);
      await writeJSON("schedule.json", updated);
      updateSchedule(updated);
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
      const updated = scheduleItems.map(day => ({
        ...day,
        items: day.items?.filter((i: any) => i.id !== id) || []
      })).filter(day => day.items.length > 0);
      setScheduleItems(updated);
      await writeJSON("schedule.json", updated);
      updateSchedule(updated);
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
    setSessionForm({
      id: "ses" + Date.now(),
      title: "",
      speaker: "",
      date: "",
      time: "",
      toTime: "",
      hall: "",
      link: "",
    });
    setShowSessionForm(true);
  }

  function handleEditSession(item: any) {
    setEditingSession(item);
    setSessionForm({ ...item });
    setShowSessionForm(true);
  }

  async function handleSaveSession() {
    try {
      let updated: any[];
      if (editingSession) {
        updated = sessionItems.map(s => s.id === editingSession.id ? { ...sessionForm } : s);
      } else {
        updated = [...sessionItems, { ...sessionForm }];
      }
      setSessionItems(updated);
      await writeJSON("sessions.json", updated);
      updateSessions(updated);
      setShowSessionForm(false);
      setEditingSession(null);
      showToast("Session saved successfully ✓", "success");
    } catch (err) {
      showToast("Failed to save session", "error");
    }
  }

  async function handleDeleteSession(id: string) {
    if (!confirm("Delete this session?")) return;
    try {
      setIsGlobalLoading(true);
      const updated = sessionItems.filter(s => s.id !== id);
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
        if (confirm("Are you sure you want to apply these feature settings to ALL users?")) {
          const statusMap: any = {
            active: { access: true, status: "full" },
            coming_soon: { access: true, status: "coming_soon" },
            disabled: { access: false, status: "coming_soon" },
          };
          const newAccess: any = {};
          for (const k in featureSettings) {
            newAccess[k] = statusMap[featureSettings[k] || "active"];
          }
          const updatedUsers = users.map(u => ({ ...u, featureAccess: newAccess }));
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
          ? { ...u, featureAccess: userFeatureAccess, visibleFields: userVisibleFields }
          : u
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
      const hay = [
        u.name, u.username, u.role, u.email, u.id
      ].filter(Boolean).join(" ").toLowerCase();
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
            <button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 p-2 px-4 rounded font-bold cursor-pointer transition-colors whitespace-nowrap">+ Create New User</button>
          </div>
        </div>

        {/* Filters and View Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Filter:</span>
            <select
              value={roleFilter}
              onChange={e => handleRoleFilterChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-black bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            >
              <option value="all">📁 All Roles</option>
              <option value="admin">🔧 Admin</option>
              <option value="doctor">🩺 Doctor</option>
              <option value="staff">💼 Staff</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">View:</span>
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
          mode={editingUser ? 'edit' : 'create'}
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
                      <h4 className="font-bold text-gray-900 truncate">{u.name}</h4>
                      <p className="text-gray-500 truncate">{u.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.role === 'admin' ? 'bg-yellow-200 text-yellow-800' : 
                      u.role === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                      <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 font-bold">
                    <button onClick={() => handleImpersonate(u)} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-center font-bold">👁 View</button>
                    <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="flex-1 py-1.5 text-blue-600 hover:bg-blue-50 bg-blue-50 rounded text-xs text-center font-bold">✏️ Edit</button> 
                    <button onClick={() => handleDeleteUser(u.id)} className="flex-1 py-1.5 text-red-600 hover:bg-red-50 bg-red-50 rounded text-xs text-center font-bold">🗑 Delete</button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-gray-500">No users found.</div>
              )}
            </div>

            {/* Desktop List View */}
            <div className="hidden md:block overflow-x-auto">
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
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <UserAvatar user={u} size="md" />
                      </td>
                      <td className="p-4 font-semibold">{u.name}</td>
                      <td className="p-4 text-gray-500">{u.username}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.role === 'admin' ? 'bg-yellow-200 text-yellow-800' : 
                          u.role === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-bold font-sans">
                          <button onClick={() => handleImpersonate(u)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold flex items-center gap-1">👁 View</button>
                          <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="px-2 py-1 text-blue-600 hover:bg-blue-50 bg-blue-50 rounded text-xs font-bold">✏️ Edit</button> 
                          <button onClick={() => handleDeleteUser(u.id)} className="px-2 py-1 text-red-600 hover:bg-red-0 hover:bg-red-50 bg-red-50 rounded text-xs font-bold">🗑 Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">No users found.</td>
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
              ["admin", "doctor", "staff"].map(role => {
                const group = filteredUsers.filter(u => u.role === role);
                if (group.length === 0) return null;
                return (
                  <div key={role} className="mb-8 font-sans">
                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 px-1 border-b pb-2 flex justify-between items-center">
                      <span>{role === 'admin' ? '🔧 Admin' : role === 'doctor' ? '🩺 Doctor' : '💼 Staff'}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] text-gray-500">{group.length} users</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {group.map(user => (
                        <UserGridCard 
                          key={user.id} 
                          user={user} 
                          onView={handleImpersonate} 
                          onEdit={(u) => { setEditingUser(u); setModalOpen(true); }} 
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
                  <div className="p-12 text-center text-gray-500 bg-white border rounded-xl shadow-sm">No users found for this role filter.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in font-sans">
                    {filteredUsers.map(user => (
                      <UserGridCard 
                        key={user.id} 
                        user={user} 
                        onView={handleImpersonate} 
                        onEdit={(u) => { setEditingUser(u); setModalOpen(true); }} 
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

  const ScheduleForm = () => (
    <div className="bg-white border-2 border-yellow-400 rounded-xl p-6 shadow-lg mb-6 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 mb-6 border-b pb-3">
        <span className="text-xl">📅</span>
        <h4 className="font-bold text-lg">{editingScheduleId === "new" ? "Add New Item" : "Edit Item"}</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title / Activity</label>
          <input 
            type="text" 
            placeholder="e.g. Welcome Reception"
            value={scheduleForm.activity}
            onChange={e => setScheduleForm({...scheduleForm, activity: e.target.value})}
            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
          <input 
            type="date" 
            value={scheduleForm.date}
            onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})}
            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
          <select 
            value={scheduleForm.category}
            onChange={e => setScheduleForm({...scheduleForm, category: e.target.value})}
            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-gray-900"
          >
            {(settings?.scheduleCategories || DEFAULT_SCHEDULE_CATEGORIES).map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Time</label>
          <input 
            type="time" 
            value={scheduleForm.time}
            onChange={e => setScheduleForm({...scheduleForm, time: e.target.value})}
            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Time</label>
          <input 
            type="time" 
            value={scheduleForm.endTime}
            onChange={e => setScheduleForm({...scheduleForm, endTime: e.target.value})}
            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-gray-900"
          />
        </div>
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Location Name</label>
            <input 
              type="text" 
              placeholder="e.g. Grand Ballroom"
              value={scheduleForm.location}
              onChange={e => setScheduleForm({...scheduleForm, location: e.target.value})}
              className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Map Location (Coordinates or Link)</label>
            <input 
              type="text" 
              placeholder="e.g. 50.0755, 14.4378"
              value={scheduleForm.mapLocation}
              onChange={e => setScheduleForm({...scheduleForm, mapLocation: e.target.value})}
              className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-gray-900"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">External Link (Optional)</label>
          <input 
            type="url" 
            placeholder="https://..."
            value={scheduleForm.link}
            onChange={e => setScheduleForm({...scheduleForm, link: e.target.value})}
            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-gray-900"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notes</label>
          <textarea 
            rows={2}
            placeholder="Any additional details..."
            value={scheduleForm.notes}
            onChange={e => setScheduleForm({...scheduleForm, notes: e.target.value})}
            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Visible To Roles</label>
          <div className="flex flex-wrap gap-3">
            {["admin", "doctor", "staff"].map(role => (
              <label key={role} className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${scheduleForm.accessRoles.includes(role) ? "bg-yellow-50 border-yellow-400 text-yellow-900" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                <input 
                  type="checkbox"
                  checked={scheduleForm.accessRoles.includes(role)}
                  onChange={e => {
                    const roles = e.target.checked 
                      ? [...scheduleForm.accessRoles, role] 
                      : scheduleForm.accessRoles.filter(r => r !== role);
                    setScheduleForm({...scheduleForm, accessRoles: roles});
                  }}
                  className="accent-yellow-500 w-4 h-4"
                />
                <span className="font-bold text-sm uppercase tracking-wider">{role}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={applyToAllSchedule}
              onChange={e => setApplyToAllSchedule(e.target.checked)}
              className="accent-yellow-500 w-5 h-5 shadow-sm"
            />
            <span className="font-bold text-sm text-yellow-900 font-bold">Apply these changes (Role/Access/Notes/Location) to ALL items</span>
          </label>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
        <button 
          onClick={() => setEditingScheduleId(null)}
          className="px-6 py-2 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button 
          onClick={handleSaveSchedule}
          className="px-8 py-2 rounded-lg bg-yellow-500 border border-yellow-600 font-bold text-black hover:bg-yellow-400 transition-colors shadow-md"
        >
          Save Item
        </button>
      </div>
    </div>
  );

  const renderTab3 = () => (
    <div>
      <h2 className="text-xl font-bold mb-6">Schedule & Sessions Control</h2>
      
      {/* Inline Form for NEW Item */}
      {editingScheduleId === "new" && <ScheduleForm />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule Manager */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">📅 Schedule Manager</h3>
            <button 
              onClick={handleAddSchedule} 
              disabled={editingScheduleId === "new"}
              className="bg-black text-white hover:bg-gray-800 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50"
            >
              + Add Schedule Item
            </button>
          </div>
          <div className="space-y-6">
            {scheduleItems.length === 0 && <p className="text-gray-400 text-center py-4">No schedule items yet.</p>}
            {[...scheduleItems].sort((a, b) => a.date.localeCompare(b.date)).map((day: any) => (
              <div key={day.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 p-3 font-bold flex justify-between items-center border-b border-gray-200">
                  <span className="text-sm font-bold text-gray-700">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="p-3 space-y-3">
                  {day.items?.map((item: any) => (
                    <div key={item.id}>
                      {editingScheduleId === item.id ? (
                        <ScheduleForm />
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors shadow-sm">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    item.category === "Scientific" ? "bg-blue-100 text-blue-700" :
                                    item.category === "Social" ? "bg-purple-100 text-purple-700" :
                                    item.category === "Transport" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                }`}>{item.category || "Other"}</span>
                                <span className="font-bold text-gray-900 truncate">{item.activity}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <span>⏰ {item.time} {item.endTime ? ` - ${item.endTime}` : ""}</span>
                                <span className="truncate max-w-[150px]">📍 {item.location || "No location"}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleEditSchedule(item)} className="p-1 px-3 bg-blue-50 text-blue-600 rounded font-bold text-xs hover:bg-blue-100">Edit</button>
                            <button onClick={() => handleDeleteSchedule(item.id)} className="p-1 px-3 bg-red-50 text-red-600 rounded font-bold text-xs hover:bg-red-100">Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions Manager */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">🎓 Sessions Manager</h3>
            <button onClick={handleAddSession} className="bg-black text-white hover:bg-gray-800 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm">+ Add Session</button>
          </div>
          <div className="space-y-4">
            {sessionItems.length === 0 && <p className="text-gray-400 text-center py-4">No sessions yet.</p>}
            {[...sessionItems].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map((session: any) => (
              <div key={session.id} className="border border-gray-200 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="font-bold flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-gray-900">{session.title}</span>
                    <span className="text-xs text-blue-600 font-bold uppercase mt-1">🗣 {session.speaker}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditSession(session)} className="text-blue-600 text-xs font-bold p-1 px-2 border border-blue-200 rounded bg-white hover:bg-blue-50">Edit</button>
                    <button onClick={() => handleDeleteSession(session.id)} className="text-red-600 text-xs font-bold p-1 px-2 border border-red-200 rounded bg-white hover:bg-red-50">Del</button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-3 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1 font-bold text-gray-700">📅 {session.date}</span>
                    <span className="flex items-center gap-1 font-bold text-gray-700">⏰ {session.time}{session.toTime ? ` – ${session.toTime}` : ""}</span>
                    <span className="flex items-center gap-1">🏛 {session.hall}</span>
                    {session.link && <span className="text-blue-600 truncate max-w-[200px]">🔗 {session.link}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

{/* Modal removed as per requirements */}

      {showSessionForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-gray-900 font-bold text-lg">
                {editingSession ? "Edit Session" : "Add Session"}
              </h3>
              <button onClick={() => setShowSessionForm(false)}
                className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
              <label className="text-gray-600 font-medium text-sm">Title</label>
              <input type="text"
                value={sessionForm.title}
                onChange={e => setSessionForm({...sessionForm, title: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Speaker</label>
              <input type="text"
                value={sessionForm.speaker}
                onChange={e => setSessionForm({...sessionForm, speaker: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Date</label>
              <input type="date"
                value={sessionForm.date}
                onChange={e => setSessionForm({...sessionForm, date: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-gray-600 font-medium text-sm">From Time</label>
                 <input type="time"
                   value={sessionForm.time}
                   onChange={e => setSessionForm({...sessionForm, time: e.target.value})}
                   className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                 />
               </div>
               <div>
                 <label className="text-gray-600 font-medium text-sm">To Time</label>
                 <input type="time"
                   value={sessionForm.toTime}
                   onChange={e => setSessionForm({...sessionForm, toTime: e.target.value})}
                   className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                 />
               </div>
             </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Hall / Location</label>
              <input type="text"
                value={sessionForm.hall}
                onChange={e => setSessionForm({...sessionForm, hall: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Session Link (Optional)</label>
              <input type="url"
                placeholder="https://..."
                value={sessionForm.link}
                onChange={e => setSessionForm({...sessionForm, link: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowSessionForm(false)}
                className="px-5 py-2 rounded-lg bg-white border border-gray-300 shadow-sm text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                className="px-5 py-2 rounded-lg bg-yellow-500 border border-yellow-600 shadow-sm text-gray-900 font-bold hover:bg-yellow-400 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const FEATURES = [
    { key: "sessions", label: "Sessions", icon: "🎓", desc: "Scientific conference sessions" },
    { key: "schedule", label: "Schedule", icon: "📅", desc: "Trip and conference schedule" },
    { key: "photoGallery", label: "Photo Gallery", icon: "📷", desc: "Conference photo gallery" },
  ];

  async function handleApplyRoleGlobal() {
    const { role, feature, status } = roleGlobalConfig;
    if (!confirm(`Apply ${status.replace('_', ' ')} status for ${feature} to ALL users with the role "${role}"?`)) return;

    try {
      setIsGlobalLoading(true);
      const statusMap: any = {
        active: { access: true, status: "full" },
        coming_soon: { access: true, status: "coming_soon" },
        disabled: { access: false, status: "coming_soon" },
      };
      
      const newStatus = statusMap[status];
      const updatedUsers = users.map(u => {
        if (u.role === role) {
          return {
            ...u,
            featureAccess: {
              ...(u.featureAccess || {}),
              [feature]: newStatus
            }
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
           <p className="text-gray-600 text-sm mb-6">Apply a feature status to entire roles at once.</p>
           
           <div className="flex flex-col md:flex-row items-end gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
             <div className="w-full md:w-1/4">
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Target Role</label>
               <select 
                 value={roleGlobalConfig.role}
                 onChange={e => setRoleGlobalConfig({...roleGlobalConfig, role: e.target.value})}
                 className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-yellow-500 outline-none"
               >
                 <option value="doctor">Doctor</option>
                 <option value="staff">Staff</option>
                 <option value="admin">Admin</option>
               </select>
             </div>
             <div className="w-full md:w-1/4">
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Feature</label>
               <select 
                 value={roleGlobalConfig.feature}
                 onChange={e => setRoleGlobalConfig({...roleGlobalConfig, feature: e.target.value})}
                 className="w-full p-2 border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-yellow-500 outline-none"
               >
                 {FEATURES.map(f => (
                   <option key={f.key} value={f.key}>{f.label}</option>
                 ))}
               </select>
             </div>
             <div className="w-full md:w-1/4">
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">New Status</label>
               <select 
                 value={roleGlobalConfig.status}
                 onChange={e => setRoleGlobalConfig({...roleGlobalConfig, status: e.target.value})}
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
              {FEATURES.map(feature => (
                <div key={feature.key} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <p className="text-gray-900 font-semibold">{feature.label}</p>
                      <p className="text-gray-500 text-xs">{feature.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={featureSettings[feature.key] || "active"}
                      onChange={e => setFeatureSettings({ ...featureSettings, [feature.key]: e.target.value })}
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
              <input type="checkbox" checked={applyFeaturesToAllUsers} onChange={(e) => setApplyFeaturesToAllUsers(e.target.checked)} className="accent-yellow-500 w-5 h-5"/>
              <span className="font-bold text-sm">Apply global feature settings to ALL users</span>
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
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
            </select>
          </div>

          {selectedFeatureUser ? (
             <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURES.map(feature => {
                    const access = userFeatureAccess[feature.key];
                    const isEnabled = access !== false && access !== undefined;
                    const status = typeof access === "string" ? access : access?.status || "full";
                    
                    return (
                        <div key={feature.key} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{feature.icon}</span>
                                    <div>
                                        <p className="text-gray-900 font-medium">{feature.label}</p>
                                        <p className="text-gray-500 text-xs">{feature.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUserFeatureAccess({
                                        ...userFeatureAccess,
                                        [feature.key]: isEnabled ? false : "full"
                                    })}
                                    className={`relative w-12 h-6 rounded-full transition-colors border ${isEnabled ? "bg-yellow-500 border-yellow-600" : "bg-gray-200 border-gray-300"}`}
                                >
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${isEnabled ? "translate-x-7" : "translate-x-1"}`} />
                                </button>
                            </div>
                            {isEnabled && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-gray-500 text-xs">Status:</span>
                                    <select
                                        value={status}
                                        onChange={e => setUserFeatureAccess({
                                            ...userFeatureAccess,
                                            [feature.key]: e.target.value
                                        })}
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
            <div className="text-gray-500 text-center py-8">Select a user above to modify their access overrides.</div>
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
        updated = media.map(m => m.id === editingMediaPost.id ? { ...postForm, id: editingMediaPost.id } : m);
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
      const updated = media.filter(m => m.id !== id);
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
         <button onClick={handleAddMedia} className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 shadow-sm transition-all">+ Create Post</button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {media.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No posts. Create one to get started.</p>}
         {media.map((post: any) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group h-full hover:shadow-md transition-all">
              <div className="relative aspect-video bg-gray-200">
                 <img src={post.imageDataUrl} alt={post.title} className="w-full h-full object-cover" />
                 <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEditMedia(post)} className="p-2 bg-white text-blue-600 rounded-lg shadow hover:bg-blue-50">✏️</button>
                    <button onClick={() => handleDeleteMedia(post.id)} className="p-2 bg-white text-red-600 rounded-lg shadow hover:bg-red-50">🗑</button>
                 </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">{post.category}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                 <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{post.title}</h3>
                 <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{post.caption || "No caption provided."}</p>
                 
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
                          📅 {new Date(post.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                      <div className="px-2 py-1 bg-[#FFBF00] text-black text-[9px] font-black rounded inline-flex items-center gap-1 uppercase tracking-tighter shadow-sm border border-yellow-600/20">
                        {(!post.audienceType || post.audienceType === "all") && <>🌍 All Users</>}
                        {post.audienceType === "roles" && <>👥 Roles: {(post.audienceRoles || []).join(", ")}</>}
                        {post.audienceType === "users" && <>👤 {(post.audienceUserIds || []).length} Specific Users</>}
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
    </div>
    );
  };

  const renderTab6 = () => {
    const schedCats = settings?.scheduleCategories || DEFAULT_SCHEDULE_CATEGORIES;
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
              <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                <span className="font-bold text-gray-700">{cat}</span>
                <button 
                  onClick={() => handleDeleteCategory('schedule', cat)}
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
              onChange={e => setNewSchedCat(e.target.value)}
              className="flex-1 p-2 border rounded focus:ring-1 focus:ring-yellow-500 outline-none"
            />
            <button 
              onClick={() => handleAddCategory('schedule')}
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
              <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                <span className="font-bold text-gray-700">{cat}</span>
                <button 
                  onClick={() => handleDeleteCategory('media', cat)}
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
              onChange={e => setNewMediaCat(e.target.value)}
              className="flex-1 p-2 border rounded focus:ring-1 focus:ring-yellow-500 outline-none"
            />
            <button 
              onClick={() => handleAddCategory('media')}
              className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800"
            >
              Add
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
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Admin Control Panel</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Management Suite</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-black shadow-sm">
            v{APP_VERSION}
          </span>
          <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">Current Build</span>
        </div>
      </div>

      {/* Global Saving Overlay */}
      {isGlobalLoading && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500 border-t-transparent"></div>
          <p className="text-white font-bold text-xl drop-shadow-md">Saving changes...</p>
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
          <option value="users">👥 User Management</option>
          <option value="appConfig">⚙️ App Settings</option>
          <option value="tripInfo">✈️ Trip Info</option>
          <option value="schedule">📅 Schedule & Sessions</option>
          <option value="features">⚙️ Feature Flags</option>
          <option value="media">🖼️ Media / Posts</option>
          <option value="categories">🎨 Categories</option>
        </select>
      </div>

      {/* Desktop/Tablet: Horizontal Tab Bar */}
      <div className="hidden md:flex mb-6 gap-2 border-b overflow-x-auto pb-[1px]">
        {[
          { key: 'users', label: '👥 User Management' },
          { key: 'appConfig', label: '⚙️ App Settings' },
          { key: 'tripInfo', label: '✈️ Trip Info' },
          { key: 'schedule', label: '📅 Schedule & Sessions' },
          { key: 'features', label: '⚙️ Feature Flags' },
          { key: 'media', label: '🖼️ Media / Posts' },
          { key: 'categories', label: '🎨 Categories' }
        ].map(tab => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-6 font-bold whitespace-nowrap border-b-4 transition-colors ${
              activeTab === tab.key ? 'border-yellow-500 text-black' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pb-12">
        {activeTab === 'users' && renderTab1()}
        {activeTab === 'appConfig' && renderAppConfigTab()}
        {activeTab === 'tripInfo' && renderTripInfoTab()}
        {activeTab === 'schedule' && renderTab3()}
        {activeTab === 'features' && renderTab4()}
        {activeTab === 'media' && renderTab5()}
        {activeTab === 'categories' && renderTab6()}
      </div>
    </Layout>
  );
}
