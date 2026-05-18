/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { writeJSON } from '../utils/github';
import UserControlCard from '../components/UserControlCard';
import MediaPostViewerModal from '../components/MediaPostViewerModal';
import { showToast } from '../components/Toast';

export default function Admin() {
  const { 
    currentUser, users, schedule, sessions, settings, media = [],
    updateUsers, updateSchedule, updateSessions, updateSettings, updateMedia
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
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [applyToAllSchedule, setApplyToAllSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    id: "",
    date: "",
    time: "",
    activity: "",
    location: "",
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
    hall: "",
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
  const [mediaForm, setMediaForm] = useState({
    id: "", category: "trips", title: "", description: "", caption: "", imageDataUrl: ""
  });
  const [selectedPost, setSelectedPost] = useState<any>(null);

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
        documents: "coming_soon",
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

  // --- TAB 1 METHODS ---
  const handleSaveUser = async (updatedUser: any, applyToAllTravel: boolean = false) => {
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
    setEditingSchedule(null);
    setScheduleForm({
      id: "s" + Date.now(),
      date: "",
      time: "",
      activity: "",
      location: "",
      notes: "",
      accessRoles: ["admin", "doctor", "staff"],
      accessUserIds: [],
    });
    setShowScheduleForm(true);
  }

  function handleEditSchedule(item: any) {
    setEditingSchedule(item);
    setScheduleForm({ ...item, accessRoles: item.accessRoles || [], accessUserIds: item.accessUserIds || [] });
    setShowScheduleForm(true);
  }

  async function handleSaveSchedule() {
    try {
      let updated: any[];
      if (applyToAllSchedule) {
        if (!confirm("Are you sure you want to apply these details to ALL schedule items?")) return;
        updated = scheduleItems.map(day => ({
          ...day,
          items: day.items?.map((i: any) => ({
            ...i,
            date: scheduleForm.date,
            time: scheduleForm.time,
            location: scheduleForm.location,
            notes: scheduleForm.notes,
            accessRoles: scheduleForm.accessRoles,
            accessUserIds: scheduleForm.accessUserIds
          })) || []
        }));
      } else if (editingSchedule) {
        let found = false;
        updated = scheduleItems.map(day => {
          if (day.items?.some((i: any) => i.id === editingSchedule.id)) {
            found = true;
            return {
              ...day,
              items: day.items.map((i: any) => i.id === editingSchedule.id ? { ...scheduleForm } : i)
            };
          }
          return day;
        });
        if (!found) {
          updated = [...scheduleItems, { id: 'd' + Date.now(), date: scheduleForm.date, title: "Schedule", items: [{...scheduleForm}] }];
        }
      } else {
        // Find existing day or create new
        const dayIdx = scheduleItems.findIndex(d => d.date === scheduleForm.date);
        updated = [...scheduleItems];
        if (dayIdx >= 0) {
          updated[dayIdx] = { ...updated[dayIdx], items: [...(updated[dayIdx].items || []), { ...scheduleForm }] };
        } else {
          updated.push({ id: 'd' + Date.now(), date: scheduleForm.date, title: "Schedule Update", items: [{ ...scheduleForm }] });
        }
      }
      setScheduleItems(updated);
      await writeJSON("schedule.json", updated);
      updateSchedule(updated);
      setShowScheduleForm(false);
      setEditingSchedule(null);
      setApplyToAllSchedule(false);
      showToast("Schedule saved successfully ✓", "success");
    } catch (err) {
      showToast("Failed to save schedule", "error");
    }
  }

  async function handleDeleteSchedule(id: string) {
    if (!confirm("Delete this schedule item?")) return;
    try {
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
      hall: "",
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
      const updated = sessionItems.filter(s => s.id !== id);
      setSessionItems(updated);
      await writeJSON("sessions.json", updated);
      updateSessions(updated);
      showToast("Session deleted", "success");
    } catch (err) {
      showToast("Failed to delete", "error");
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

  const renderTab3 = () => (
    <div>
      <h2 className="text-xl font-bold mb-6">Schedule & Sessions Control</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule Manager */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">📅 Schedule Manager</h3>
            <button onClick={handleAddSchedule} className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-bold">+ Add Schedule Item</button>
          </div>
          <div className="space-y-4">
            {scheduleItems.map((day: any) => (
              <div key={day.id} className="border p-4 rounded bg-gray-50">
                <div className="font-bold flex justify-between">
                  <span>{day.date}: {day.title}</span>
                </div>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  {day.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
                      <span>{item.time} - {item.activity}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSchedule(item)} className="text-blue-500">Edit</button>
                        <button onClick={() => handleDeleteSchedule(item.id)} className="text-red-500">Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions Manager */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">🎓 Sessions Manager</h3>
            <button onClick={handleAddSession} className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-bold">+ Add Session</button>
          </div>
          <div className="space-y-4">
            {sessionItems.map((session: any) => (
              <div key={session.id} className="border p-4 rounded bg-gray-50">
                <div className="font-bold flex justify-between">
                  <span>{session.title}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditSession(session)} className="text-blue-500 text-sm">Edit</button>
                    <button onClick={() => handleDeleteSession(session.id)} className="text-red-500 text-sm">Del</button>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">{session.speaker} - {session.date} {session.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showScheduleForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-gray-900 font-bold text-lg">
                {editingSchedule ? "Edit Schedule Item" : "Add Schedule Item"}
              </h3>
              <button onClick={() => setShowScheduleForm(false)}
                className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
              <label className="text-gray-600 font-medium text-sm">Date</label>
              <input type="date"
                value={scheduleForm.date}
                onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Time</label>
              <input type="time"
                value={scheduleForm.time}
                onChange={e => setScheduleForm({...scheduleForm, time: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Activity</label>
              <input type="text"
                value={scheduleForm.activity}
                onChange={e => setScheduleForm({...scheduleForm, activity: e.target.value})}
                placeholder="Activity title..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Location</label>
              <input type="text"
                value={scheduleForm.location}
                onChange={e => setScheduleForm({...scheduleForm, location: e.target.value})}
                placeholder="Location..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Notes</label>
              <textarea
                value={scheduleForm.notes}
                onChange={e => setScheduleForm({...scheduleForm, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Visible to Roles</label>
              <div className="flex gap-4 mt-2">
                {["admin", "doctor", "staff"].map(role => (
                  <label key={role} className="flex items-center gap-2 text-gray-800 font-medium text-sm cursor-pointer border px-3 py-1.5 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={scheduleForm.accessRoles.includes(role)}
                      onChange={e => {
                        const roles = e.target.checked
                          ? [...scheduleForm.accessRoles, role]
                          : scheduleForm.accessRoles.filter(r => r !== role);
                        setScheduleForm({...scheduleForm, accessRoles: roles});
                      }}
                      className="accent-yellow-500 w-4 h-4 cursor-pointer"
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Individual User Access (override)</label>
              <div className="space-y-1 mt-2 max-h-32 overflow-y-auto bg-gray-50 border border-gray-200 p-2 rounded-lg">
                {users.map((u: any) => (
                  <label key={u.id} className="flex items-center gap-2 text-gray-800 font-medium text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={scheduleForm.accessUserIds.includes(u.id)}
                      onChange={e => {
                        const ids = e.target.checked
                          ? [...scheduleForm.accessUserIds, u.id]
                          : scheduleForm.accessUserIds.filter(id => id !== u.id);
                        setScheduleForm({...scheduleForm, accessUserIds: ids});
                      }}
                      className="accent-yellow-500 w-4 h-4 cursor-pointer"
                    />
                    {u.name} ({u.role})
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg max-w-max mx-auto shadow-sm hover:bg-yellow-100 transition-colors mt-4">
              <input type="checkbox" checked={applyToAllSchedule} onChange={(e) => setApplyToAllSchedule(e.target.checked)} className="accent-yellow-500 w-5 h-5"/>
              <span className="font-bold text-sm">Apply to all schedule items</span>
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => setShowScheduleForm(false)}
                className="px-5 py-2 rounded-lg bg-white border border-gray-300 shadow-sm text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-5 py-2 rounded-lg bg-yellow-500 border border-yellow-600 shadow-sm text-gray-900 font-bold hover:bg-yellow-400 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
             <div>
              <label className="text-gray-600 font-medium text-sm">Time</label>
              <input type="time"
                value={sessionForm.time}
                onChange={e => setSessionForm({...sessionForm, time: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium text-sm">Hall</label>
              <input type="text"
                value={sessionForm.hall}
                onChange={e => setSessionForm({...sessionForm, hall: e.target.value})}
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
    { key: "documents", label: "Documents", icon: "📄", desc: "Conference documents and files" },
  ];

  const renderTab4 = () => {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Feature & Access Control</h2>
        
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
  const handleImageSelect = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      showToast("Image must be smaller than 1.5MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev: any) => {
      setMediaForm({ ...mediaForm, imageDataUrl: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  async function handleSaveMedia() {
    try {
      if (!mediaForm.title.trim() || !mediaForm.imageDataUrl) {
         showToast("Title and Photo are required", "error");
         return;
      }
      let updated: any[];
      if (mediaForm.id.startsWith("m_")) { 
        updated = media.map(m => m.id === mediaForm.id ? { ...mediaForm } : m);
      } else {
        updated = [{ ...mediaForm, id: "m_" + Date.now(), createdAt: new Date().toISOString(), createdByUserId: currentUser.id }, ...media];
      }
      await writeJSON("media.json", updated);
      updateMedia(updated);
      setShowMediaForm(false);
      showToast("Post saved successfully ✓", "success");
    } catch (e) {
      showToast("Failed to save post", "error");
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
         <button onClick={() => { setMediaForm({ id: "", title: "", description: "", caption: "", category: "trips", imageDataUrl: "" }); setShowMediaForm(true); }} className="bg-yellow-500 hover:bg-yellow-600 p-2 px-4 rounded font-bold transition-colors whitespace-nowrap">+ Create Post</button>
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {media.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No posts. Create one to get started.</p>}
         {media.map((post: any) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPost(post)}>
              <img src={post.imageDataUrl} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-4 flex-1 flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded capitalize">{post.category}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteMedia(post.id); }} className="text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 px-2 py-1 rounded z-10">Delete</button>
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
                         <option value="program">Program</option>
                         <option value="trips">Trips</option>
                         <option value="places">Places</option>
                         <option value="meetings">Meetings</option>
                         <option value="photos">Photos</option>
                       </select>
                    </div>
                 </div>
                 <textarea value={mediaForm.description} onChange={e => setMediaForm({...mediaForm, description: e.target.value})} placeholder="Description (Optional)" className="w-full p-2 border rounded h-20" />
                 <input value={mediaForm.caption} onChange={e => setMediaForm({...mediaForm, caption: e.target.value})} placeholder="Caption (Optional)" className="w-full p-2 border rounded" />
              </div>
              <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                 <button onClick={() => setShowMediaForm(false)} className="px-5 py-2 bg-white border shadow-sm font-bold rounded hover:bg-gray-50 transition-colors">Cancel</button>
                 <button onClick={handleSaveMedia} className="px-5 py-2 bg-yellow-500 text-black font-bold rounded shadow hover:bg-yellow-600 transition-colors">Save Post</button>
              </div>
            </div>
         </div>
       )}
    </div>
  );
  };

  return (
    <Layout>
      <div className="mb-6 flex gap-2 border-b overflow-x-auto pb-[-1px]">
        {[
          { key: 'users', label: '👥 User Management' },
          { key: 'data', label: '📊 User Data Control' },
          { key: 'schedule', label: '📅 Schedule & Sessions' },
          { key: 'features', label: '⚙️ Feature Flags' },
          { key: 'media', label: '🖼️ Media / Posts' }
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
      </div>
    </Layout>
  );
}
