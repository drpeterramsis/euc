/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useApp, DEFAULT_SCHEDULE_CATEGORIES, DEFAULT_MEDIA_CATEGORIES } from '../context/AppContext';
import { APP_VERSION } from "../version";
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { writeJSON } from '../utils/github';
import UserControlCard from '../components/UserControlCard';
import MediaPostViewerModal from '../components/MediaPostViewerModal';
import { showToast } from '../components/Toast';
import { compressImage } from '../utils/image';

export default function Admin() {
  const { 
    currentUser, users, schedule, sessions, settings, media = [], staff = [],
    updateUsers, updateSchedule, updateSessions, updateSettings, updateMedia, updateStaff
  } = useApp();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "users";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [userSearchQuery, setUserSearchQuery] = useState("");
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
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [compressingProgress, setCompressingProgress] = useState(0);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [roleGlobalConfig, setRoleGlobalConfig] = useState({
    role: "doctor",
    feature: "schedule",
    status: "active"
  });
  const [mediaForm, setMediaForm] = useState({
    id: "", category: "trips", title: "", description: "", caption: "", imageDataUrl: "",
    link: "", linkLabel: "", allowDownload: true
  });
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // Tab 6 State (Categories)
  const [newSchedCat, setNewSchedCat] = useState("");
  const [newMediaCat, setNewMediaCat] = useState("");
  const [isSavingCats, setIsSavingCats] = useState(false);

  // Tab 7 State (Staff)
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({
    id: "",
    name: "",
    title: "",
    phone: "",
    email: "",
    photoUrl: ""
  });

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
        socialProgram: "coming_soon",
        awardsCeremony: "coming_soon",
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

  const filteredUsers = users.filter((u: any) => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.trim().toLowerCase();
    const hay = [
      u.name, u.username, u.role, u.email, u.id
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });

  const renderTab1 = () => (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">User Management</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="🔍 Search users..." 
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="p-2 border rounded w-full sm:w-64" 
          />
          <button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 p-2 px-4 rounded font-bold cursor-pointer transition-colors whitespace-nowrap">+ Create New User</button>
        </div>
      </div>
      
      <UserControlCard 
        isOpen={modalOpen} 
        mode={editingUser ? 'edit' : 'create'}
        user={editingUser} 
        onClose={() => setModalOpen(false)} 
        onSave={handleSaveUser} 
      />

      <div className="bg-white rounded-lg shadow">
        {/* Mobile View */}
        <div className="md:hidden divide-y text-sm">
          {filteredUsers.map((u: any) => (
            <div key={u.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={u.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt={u.name} className="w-12 h-12 rounded-full border bg-gray-100 object-cover flex-shrink-0" />
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
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => handleImpersonate(u)} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-center">👁 View</button>
                <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="flex-1 py-1.5 text-blue-600 hover:bg-blue-50 bg-blue-50 rounded text-xs text-center font-bold">✏️ Edit</button> 
                <button onClick={() => handleDeleteUser(u.id)} className="flex-1 py-1.5 text-red-600 hover:bg-red-50 bg-red-50 rounded text-xs text-center font-bold">🗑 Delete</button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">No users found.</div>
          )}
        </div>

        {/* Desktop View */}
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
                  <td className="p-4"><img src={u.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt={u.name} className="w-10 h-10 rounded-full border bg-gray-100 object-cover" /></td>
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
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleImpersonate(u)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold flex items-center gap-1">👁 View</button>
                      <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="px-2 py-1 text-blue-600 hover:bg-blue-50 bg-blue-50 rounded text-xs font-bold">✏️ Edit</button> 
                      <button onClick={() => handleDeleteUser(u.id)} className="px-2 py-1 text-red-600 hover:bg-red-50 bg-red-50 rounded text-xs font-bold">🗑 Delete</button>
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
    </div>
  );

  const renderTab2 = () => {
    // For Data Control, you usually select a user, then view details.
    return (
      <div>
         <h2 className="text-xl font-bold mb-4">User Data Control</h2>
         <p className="text-gray-600 mb-6 border-b pb-4">Select a user to edit their specific data (handled directly within the full Edit panel of User Management).</p>
         <button onClick={() => setActiveTab("users")} className="px-4 py-2 border rounded bg-white hover:bg-gray-50 shadow-sm font-bold">Go to User Management</button>
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
    { key: "socialProgram", label: "Social Program", icon: "🎉", desc: "Social events and activities" },
    { key: "awardsCeremony", label: "Awards Ceremony", icon: "🏆", desc: "Annual awards ceremony" },
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
  const handleImageSelect = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showToast("Please select an image file", "error");
        return;
    }
    
    try {
        setCompressingProgress(0);
        const base64 = await compressImage(file, (p) => setCompressingProgress(p));
        setMediaForm({ ...mediaForm, imageDataUrl: base64 });
    } catch (e) {
        showToast("Failed to compress image", "error");
    } finally {
        setCompressingProgress(0);
    }
  };

  async function handleSaveMedia() {
    try {
      if (!mediaForm.title.trim() || !mediaForm.imageDataUrl) {
         showToast("Title and Photo are required", "error");
         return;
      }
      setIsSavingMedia(true);

      // Link formatting
      let formattedLink = mediaForm.link?.trim() || "";
      if (formattedLink && !formattedLink.startsWith("http://") && !formattedLink.startsWith("https://")) {
        formattedLink = `https://${formattedLink}`;
      }

      const postData = {
        ...mediaForm,
        link: formattedLink,
        linkLabel: mediaForm.linkLabel?.trim() || "Open Link"
      };

      let updated: any[];
      if (mediaForm.id.startsWith("m_")) { 
        updated = media.map(m => m.id === mediaForm.id ? { ...postData } : m);
      } else {
        updated = [{ ...postData, id: "m_" + Date.now(), createdAt: new Date().toISOString(), createdByUserId: currentUser.id }, ...media];
      }
      await writeJSON("media.json", updated);
      updateMedia(updated);
      setShowMediaForm(false);
      showToast("Post saved successfully ✓", "success");
    } catch (e) {
      showToast("Failed to save post", "error");
    } finally {
      setIsSavingMedia(false);
    }
  }

  async function handleDeleteMedia(id: string) {
    if (!confirm("Delete this post?")) return;
    try {
      const updated = media.filter(m => m.id !== id);
      await writeJSON("media.json", updated);
      updateMedia(updated);
      showToast("Post deleted", "success");
    } catch (e) {
      showToast("Failed to delete post", "error");
    }
  }

  const renderTab5 = () => {
    return (
    <div>
       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
         <h2 className="text-xl font-bold">Media / Posts</h2>
         <button onClick={() => { setMediaForm({ id: "", title: "", description: "", caption: "", category: "trips", imageDataUrl: "", link: "", linkLabel: "", allowDownload: true }); setShowMediaForm(true); }} className="bg-yellow-500 hover:bg-yellow-600 p-2 px-4 rounded font-bold transition-colors whitespace-nowrap">+ Create Post</button>
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {media.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No posts. Create one to get started.</p>}
         {media.map((post: any) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPost(post)}>
              <img src={post.imageDataUrl} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded capitalize">{post.category}</span>
                    <div className="flex gap-1 z-10">
                      <button onClick={(e) => { e.stopPropagation(); setMediaForm({ ...post }); setShowMediaForm(true); }} className="text-blue-600 hover:text-blue-800 text-[10px] font-bold bg-blue-50 px-2 py-1 rounded">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteMedia(post.id); }} className="text-red-500 hover:text-red-700 text-[10px] font-bold bg-red-50 px-2 py-1 rounded">Delete</button>
                    </div>
                  </div>
                 <h3 className="font-bold text-gray-900 line-clamp-1">{post.title}</h3>
                 <p className="text-xs text-gray-400 mt-1">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</p>
                 {post.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{post.description}</p>}
                 {post.caption && <p className="text-sm italic text-gray-500 mt-2 bg-gray-50 p-2 rounded line-clamp-2">"{post.caption}"</p>}
              </div>
            </div>
         ))}
       </div>

       {selectedPost && (
         <MediaPostViewerModal post={selectedPost} onClose={() => setSelectedPost(null)} />
       )}

       {showMediaForm && (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
            {(isSavingMedia || compressingProgress > 0) && (
               <div className="fixed inset-0 z-[60] bg-black/40 flex flex-col items-center justify-center gap-4">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                 <p className="text-white font-bold text-lg">
                   {compressingProgress > 0 ? `Compressing image... ${Math.round(compressingProgress * 100)}%` : "Saving post..."}
                 </p>
               </div>
            )}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                <h2 className="text-xl font-bold">{mediaForm.id ? "Edit Post" : "Create Post"}</h2>
                <button onClick={() => setShowMediaForm(false)} className="text-xl font-bold p-2 text-gray-500 hover:text-gray-800 leading-none">✕</button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                 <div>
                    <label className="block text-sm font-bold mb-1">Upload Photo (Max 1.5MB)</label>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-800 hover:file:bg-yellow-100" />
                    {mediaForm.imageDataUrl && <img src={mediaForm.imageDataUrl} className="mt-3 w-full h-40 object-cover rounded-lg border shadow-sm" alt="Preview"/>}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <input value={mediaForm.title} onChange={e => setMediaForm({...mediaForm, title: e.target.value})} placeholder="Title *" className="w-full p-2 border rounded" />
                    </div>
                    <div className="col-span-2">
                       <select value={mediaForm.category} onChange={e => setMediaForm({...mediaForm, category: e.target.value})} className="w-full p-2 border rounded font-semibold text-gray-700">
                         {(settings?.mediaCategories || DEFAULT_MEDIA_CATEGORIES).map((cat: string) => (
                           <option key={cat} value={cat}>{cat}</option>
                         ))}
                       </select>
                    </div>
                 </div>
                 <textarea value={mediaForm.description} onChange={e => setMediaForm({...mediaForm, description: e.target.value})} placeholder="Description (Optional)" className="w-full p-2 border rounded h-20" />
                 <input value={mediaForm.caption} onChange={e => setMediaForm({...mediaForm, caption: e.target.value})} placeholder="Caption (Optional)" className="w-full p-2 border rounded" />
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                       <input value={mediaForm.link || ""} onChange={e => setMediaForm({...mediaForm, link: e.target.value})} placeholder="Button Link (Optional)" className="w-full p-2 border rounded" />
                    </div>
                    <div className="col-span-1">
                       <input value={mediaForm.linkLabel || ""} onChange={e => setMediaForm({...mediaForm, linkLabel: e.target.value})} placeholder="Button Label (Open Link)" className="w-full p-2 border rounded" />
                    </div>
                 </div>
                 <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded border">
                    <input type="checkbox" checked={mediaForm.allowDownload !== false} onChange={e => setMediaForm({...mediaForm, allowDownload: e.target.checked})} className="accent-yellow-500 w-5 h-5" />
                    <span className="text-sm font-bold">Allow users to download attachment</span>
                 </label>
              </div>
              <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                 <button onClick={() => setShowMediaForm(false)} disabled={isSavingMedia} className="px-5 py-2 bg-white border shadow-sm font-bold rounded hover:bg-gray-50 transition-colors disabled:opacity-50">Cancel</button>
                 <button onClick={handleSaveMedia} disabled={isSavingMedia} className="px-5 py-2 bg-yellow-500 text-black font-bold rounded shadow hover:bg-yellow-600 transition-colors disabled:opacity-50 min-w-[120px] flex items-center justify-center">
                    {isSavingMedia ? "Saving..." : "Save Post"}
                 </button>
              </div>
            </div>
         </div>
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

  // --- TAB 7 METHODS (Staff) ---
  const handleAddStaff = () => {
    setEditingStaffId(null);
    setStaffForm({ id: "st" + Date.now(), name: "", title: "", phone: "", email: "", photoUrl: "" });
    setShowStaffForm(true);
  };

  const handleEditStaff = (member: any) => {
    setEditingStaffId(member.id);
    setStaffForm({ ...member });
    setShowStaffForm(true);
  };

  const handleSaveStaff = async () => {
    if (!staffForm.name || !staffForm.phone) {
      showToast("Name and Phone are required", "error");
      return;
    }

    try {
      setIsGlobalLoading(true);
      let updated: any[];
      if (editingStaffId) {
        updated = staff.map(s => s.id === editingStaffId ? staffForm : s);
      } else {
        updated = [...staff, staffForm];
      }
      await writeJSON("staff.json", updated);
      updateStaff(updated);
      setShowStaffForm(false);
      showToast("Staff saved successfully", "success");
    } catch (e) {
      showToast("Failed to save staff", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    try {
      setIsGlobalLoading(true);
      const updated = staff.filter(s => s.id !== id);
      await writeJSON("staff.json", updated);
      updateStaff(updated);
      showToast("Staff deleted", "success");
    } catch (e) {
      showToast("Failed to delete staff", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const renderTab7 = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">👥 Staff Management</h2>
        <button 
          onClick={handleAddStaff}
          className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 shadow-sm"
        >
          + Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member: any) => (
          <div key={member.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex items-center gap-4 group">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-black border border-gray-200">
               {member.photoUrl ? (
                 <img src={member.photoUrl} className="w-full h-full rounded-full object-cover" />
               ) : (
                 member.name.charAt(0)
               )}
            </div>
            <div className="flex-1 min-w-0">
               <h4 className="font-bold text-gray-900 truncate">{member.name}</h4>
               <p className="text-xs text-gray-500 truncate">{member.title}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => handleEditStaff(member)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">✏️</button>
               <button onClick={() => handleDeleteStaff(member.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">🗑</button>
            </div>
          </div>
        ))}
      </div>

      {showStaffForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <span>👤</span> {editingStaffId ? "Edit Staff Member" : "New Staff Member"}
            </h3>
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={staffForm.name}
                    onChange={e => setStaffForm({...staffForm, name: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="e.g. Dr. Peter Ramsis"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Job Title</label>
                  <input 
                    type="text" 
                    value={staffForm.title}
                    onChange={e => setStaffForm({...staffForm, title: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="e.g. Trip Coordinator"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number (WhatsApp)</label>
                  <input 
                    type="text" 
                    value={staffForm.phone}
                    onChange={e => setStaffForm({...staffForm, phone: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="e.g. +201069996672"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={staffForm.email}
                    onChange={e => setStaffForm({...staffForm, email: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="peter@evapharma.com"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Photo URL (Optional)</label>
                  <input 
                    type="url" 
                    value={staffForm.photoUrl}
                    onChange={e => setStaffForm({...staffForm, photoUrl: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="https://..."
                  />
               </div>
            </div>
            <div className="flex gap-3 mt-8">
               <button onClick={() => setShowStaffForm(false)} className="flex-1 py-2.5 border rounded-xl font-bold bg-white hover:bg-gray-50 transition-colors">Cancel</button>
               <button onClick={handleSaveStaff} className="flex-1 py-2.5 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 shadow-md transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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

      <div className="mb-6 flex gap-2 border-b overflow-x-auto pb-[-1px]">
        {[
          { key: 'users', label: '👥 User Management' },
          { key: 'data', label: '📊 User Data Control' },
          { key: 'schedule', label: '📅 Schedule & Sessions' },
          { key: 'features', label: '⚙️ Feature Flags' },
          { key: 'media', label: '🖼️ Media / Posts' },
          { key: 'categories', label: '🎨 Categories' },
          { key: 'staff', label: '👥 Staff Management' }
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
        {activeTab === 'data' && renderTab2()}
        {activeTab === 'schedule' && renderTab3()}
        {activeTab === 'features' && renderTab4()}
        {activeTab === 'media' && renderTab5()}
        {activeTab === 'categories' && renderTab6()}
        {activeTab === 'staff' && renderTab7()}
      </div>
    </Layout>
  );
}
