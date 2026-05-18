
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';

/**
 * UserModal component renders a form for Add/Edit user functionality.
 */
export default function UserModal({ user, onClose, onSave }: any) {
  const [formData, setFormData] = useState(user || {
    id: Date.now().toString(),
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now(),
    role: 'doctor',
    isActive: true
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{user ? 'Edit User' : 'Add New User'}</h2>
        <div className="space-y-3">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border rounded" />
            <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="w-full p-2 border rounded" />
            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full p-2 border rounded" />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded" />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="w-full p-2 border rounded" />
            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="staff">Staff</option>
            </select>
            <div className="flex items-center gap-2">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="p-2" />
                <label>Is Active</label>
            </div>
        </div>
        <div className="flex justify-end mt-6 space-x-2">
            <button onClick={onClose} className="p-2 px-4 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
            <button onClick={() => { console.log('Saving:', formData); onSave(formData); }} className="p-2 px-4 bg-yellow-500 rounded text-black font-bold hover:bg-yellow-600">Save</button>
        </div>
      </div>
    </div>
  );
}
