/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { Navigate } from 'react-router-dom';
import { writeJSON } from '../utils/github';
import UserModal from '../components/UserModal';

/**
 * Admin component renders user management table and controls.
 */
export default function Admin() {
  const { users, currentUser, updateUsers } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSave = async (user: any) => {
    let newUsers;
    if (editingUser) {
        newUsers = users.map(u => u.id === user.id ? user : u);
    } else {
        newUsers = [...users, user];
    }
    await writeJSON('users.json', newUsers);
    updateUsers(newUsers);
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id: string) => {
    if(confirm("Are you sure?")) {
        const newUsers = users.filter(u => u.id !== id);
        await writeJSON('users.json', newUsers);
        updateUsers(newUsers);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6 pt-4">
        <h1 className="text-2xl font-bold">User Management (Admin)</h1>
        <button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 p-2 px-4 rounded font-bold cursor-pointer">Add User</button>
      </div>
      
      {modalOpen && <UserModal user={editingUser} onClose={() => setModalOpen(false)} onSave={handleSave} />}

      <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Username</th>
              <th className="p-2">Role</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-2 flex items-center gap-2"><img src={u.photo} className="w-8 h-8 rounded-full" /> {u.name}</td>
                <td className="p-2">{u.username}</td>
                <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-yellow-200' : 'bg-gray-200'}`}>{u.role}</span></td>
                <td className="p-2">{u.isActive ? "Active" : "Inactive"}</td>
                <td className="p-2">
                    <button onClick={() => { setEditingUser(u); setModalOpen(true); }} className="text-blue-500 mr-2">Edit</button> 
                    <button onClick={() => handleDelete(u.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
