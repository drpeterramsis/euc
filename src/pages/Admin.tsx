/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
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

  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

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
                <td className="p-4"><img src={u.photo} alt={u.name} className="w-10 h-10 rounded-full border bg-gray-100" /></td>
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
                    <button onClick={() => handleImpersonate(u)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold flex items-center gap-1">👁 View Dashboard</button>
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
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">📅 Schedule Manager</h3>
            <button className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-bold">+ Add Schedule Item</button>
          </div>
          <div className="space-y-4">
            {schedule.map((day: any) => (
              <div key={day.id} className="border p-4 rounded bg-gray-50">
                <div className="font-bold flex justify-between">
                  <span>{day.date}: {day.title}</span>
                  <button className="text-blue-500 text-sm">Edit Day</button>
                </div>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  {day.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
                      <span>{item.time} - {item.activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">🎓 Sessions Manager</h3>
            <button className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm font-bold">+ Add Session</button>
          </div>
          <div className="space-y-4">
            {sessions.map((session: any) => (
              <div key={session.id} className="border p-4 rounded bg-gray-50">
                <div className="font-bold flex justify-between">
                  <span>{session.title}</span>
                  <button className="text-blue-500 text-sm">Edit</button>
                </div>
                <div className="text-sm text-gray-500 mt-1">{session.speaker} - {session.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTab4 = () => {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Feature & Access Control</h2>
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h3 className="font-bold text-lg border-b pb-2">Global Feature Flags</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(settings?.features || {}).map(f => (
              <div key={f} className="flex items-center justify-between p-4 border rounded bg-gray-50">
                 <div>
                    <div className="font-bold capitalize">{f.replace(/_/g, " ")}</div>
                 </div>
                 <div className="flex bg-gray-200 rounded p-1">
                    <button className={`px-3 py-1 rounded text-sm ${settings.features[f] ? 'bg-white shadow font-bold' : ''}`}>ON</button>
                    <button className={`px-3 py-1 rounded text-sm ${!settings.features[f] ? 'bg-white shadow font-bold text-gray-500' : ''}`}>OFF</button>
                 </div>
              </div>
            ))}
          </div>
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
