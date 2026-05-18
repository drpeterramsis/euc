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
import { showToast } from '../components/Toast';

export default function Admin() {
  const { currentUser, users, schedule, sessions, settings, updateUsers } = useApp();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "users";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Data Control state
  const [selectedDataUser, setSelectedDataUser] = useState<any>(null);

  // Tab 3 State (Schedule & Sessions)
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
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
  const [selectedFeatureUser, setSelectedFeatureUser] = useState<string>("");
  const [userFeatureAccess, setUserFeatureAccess] = useState<any>({});
  const [userVisibleFields, setUserVisibleFields] = useState<any>({});
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);

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
      if (editingSchedule) {
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
      sessionStorage.setItem("euc_session_schedule", JSON.stringify(updated));
      setShowScheduleForm(false);
      setEditingSchedule(null);
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
      sessionStorage.setItem("euc_session_schedule", JSON.stringify(updated));
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
      sessionStorage.setItem("euc_session_sessions", JSON.stringify(updated));
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
      sessionStorage.setItem("euc_session_sessions", JSON.stringify(updated));
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
      sessionStorage.setItem("euc_session_settings", JSON.stringify(updatedSettings));
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
      sessionStorage.setItem("euc_session_users", JSON.stringify(updated));
      showToast("User access saved ✓", "success");
    } catch (err) {
      showToast("Failed to save user access", "error");
    } finally {
      setIsSavingFeatures(false);
    }
  }

  const renderTab1 = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">User Management</h2>
        <div className="flex gap-4">
          <input type="text" placeholder="🔍 Search users..." className="p-2 border rounded" />
          <button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 p-2 px-4 rounded font-bold cursor-pointer transition-colors">+ Create New User</button>
        </div>
      </div>
      
      <UserControlCard 
        isOpen={modalOpen} 
        mode={editingUser ? 'edit' : 'create'}
        user={editingUser} 
        onClose={() => setModalOpen(false)} 
        onSave={() => setModalOpen(false)} 
      />

      <div className="bg-white rounded-lg shadow overflow-x-auto">
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
            {users.map((u: any) => (
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
                    <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="px-2 py-1 text-blue-600 hover:bg-blue-50 bg-blue-50 rounded text-xs">✏️ Edit</button> 
                    <button onClick={() => handleDeleteUser(u.id)} className="px-2 py-1 text-red-600 hover:bg-red-50 bg-red-50 rounded text-xs">🗑 Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl w-full max-w-lg p-6 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">
                {editingSchedule ? "Edit Schedule Item" : "Add Schedule Item"}
              </h3>
              <button onClick={() => setShowScheduleForm(false)}
                className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Date</label>
              <input type="date"
                value={scheduleForm.date}
                onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Time</label>
              <input type="time"
                value={scheduleForm.time}
                onChange={e => setScheduleForm({...scheduleForm, time: e.target.value})}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Activity</label>
              <input type="text"
                value={scheduleForm.activity}
                onChange={e => setScheduleForm({...scheduleForm, activity: e.target.value})}
                placeholder="Activity title..."
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Location</label>
              <input type="text"
                value={scheduleForm.location}
                onChange={e => setScheduleForm({...scheduleForm, location: e.target.value})}
                placeholder="Location..."
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Notes</label>
              <textarea
                value={scheduleForm.notes}
                onChange={e => setScheduleForm({...scheduleForm, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Visible to Roles</label>
              <div className="flex gap-4 mt-2">
                {["admin", "doctor", "staff"].map(role => (
                  <label key={role} className="flex items-center gap-2 text-white text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.accessRoles.includes(role)}
                      onChange={e => {
                        const roles = e.target.checked
                          ? [...scheduleForm.accessRoles, role]
                          : scheduleForm.accessRoles.filter(r => r !== role);
                        setScheduleForm({...scheduleForm, accessRoles: roles});
                      }}
                      className="accent-yellow-400 w-4 h-4"
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Individual User Access (override)</label>
              <div className="space-y-1 mt-2 max-h-32 overflow-y-auto bg-gray-800 p-2 rounded">
                {users.map((u: any) => (
                  <label key={u.id} className="flex items-center gap-2 text-white text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.accessUserIds.includes(u.id)}
                      onChange={e => {
                        const ids = e.target.checked
                          ? [...scheduleForm.accessUserIds, u.id]
                          : scheduleForm.accessUserIds.filter(id => id !== u.id);
                        setScheduleForm({...scheduleForm, accessUserIds: ids});
                      }}
                      className="accent-yellow-400 w-4 h-4"
                    />
                    {u.name} ({u.role})
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowScheduleForm(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl w-full max-w-lg p-6 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">
                {editingSession ? "Edit Session" : "Add Session"}
              </h3>
              <button onClick={() => setShowSessionForm(false)}
                className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Title</label>
              <input type="text"
                value={sessionForm.title}
                onChange={e => setSessionForm({...sessionForm, title: e.target.value})}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Speaker</label>
              <input type="text"
                value={sessionForm.speaker}
                onChange={e => setSessionForm({...sessionForm, speaker: e.target.value})}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Date</label>
              <input type="date"
                value={sessionForm.date}
                onChange={e => setSessionForm({...sessionForm, date: e.target.value})}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>
             <div>
              <label className="text-gray-400 text-sm">Time</label>
              <input type="time"
                value={sessionForm.time}
                onChange={e => setSessionForm({...sessionForm, time: e.target.value})}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Hall</label>
              <input type="text"
                value={sessionForm.hall}
                onChange={e => setSessionForm({...sessionForm, hall: e.target.value})}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowSessionForm(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-300"
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
                className="bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-50"
              >
                {isSavingFeatures ? "Saving..." : "Save Global Features"}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURES.map(feature => (
                <div key={feature.key} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <p className="text-white font-semibold">{feature.label}</p>
                      <p className="text-gray-400 text-xs">{feature.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={featureSettings[feature.key] || "active"}
                      onChange={e => setFeatureSettings({ ...featureSettings, [feature.key]: e.target.value })}
                      className="bg-gray-700 text-white rounded-lg px-2 py-1 text-sm outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="coming_soon">Coming Soon</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-bold text-lg">👤 Per-User Feature Overrides</h3>
            <select
                value={selectedFeatureUser}
                onChange={(e) => setSelectedFeatureUser(e.target.value)}
                className="p-2 border rounded font-semibold min-w-[200px]"
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
                        <div key={feature.key} className="bg-gray-800 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{feature.icon}</span>
                                    <div>
                                        <p className="text-white font-medium">{feature.label}</p>
                                        <p className="text-gray-400 text-xs">{feature.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUserFeatureAccess({
                                        ...userFeatureAccess,
                                        [feature.key]: isEnabled ? false : "full"
                                    })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${isEnabled ? "bg-yellow-400" : "bg-gray-600"}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? "translate-x-7" : "translate-x-1"}`} />
                                </button>
                            </div>
                            {isEnabled && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-gray-400 text-xs">Status:</span>
                                    <select
                                        value={status}
                                        onChange={e => setUserFeatureAccess({
                                            ...userFeatureAccess,
                                            [feature.key]: e.target.value
                                        })}
                                        className="bg-gray-700 text-white rounded px-2 py-1 text-xs outline-none"
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
                        className="bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-50"
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

  return (
    <Layout>
      <div className="mb-6 flex gap-2 border-b overflow-x-auto pb-[-1px]">
        {[
          { key: 'users', label: '👥 User Management' },
          { key: 'data', label: '📊 User Data Control' },
          { key: 'schedule', label: '📅 Schedule & Sessions' },
          { key: 'features', label: '⚙️ Feature Flags' }
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
      </div>
    </Layout>
  );
}
