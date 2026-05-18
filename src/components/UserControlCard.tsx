/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { showToast } from './Toast';
import { writeJSON } from '../utils/github';
import { useApp } from '../context/AppContext';

export default function UserControlCard({ isOpen, mode, user, onClose, onSave }: any) {
  const { users, updateUsers } = useApp();
  const [activeTab, setActiveTab] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(user || {
    id: Date.now().toString(), username: '', password: '', name: '', email: '', phone: '',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now(),
    role: 'doctor', isActive: true, featureAccess: {}, visibleFields: {},
    flightDetails: {}, hotel: {}, transfers: []
  });

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNestedChange = (section: string, e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [name]: type === 'checkbox' ? checked : value }
    }));
  };

  const handleFeatureToggle = (feature: string, field: 'access' | 'status') => {
    setFormData((prev: any) => {
      const current = prev.featureAccess?.[feature] || (field === 'access' ? 'coming_soon' : false);
      let newValue;
      
      if (field === 'access') {
        newValue = current ? false : 'coming_soon';
      } else {
        newValue = current === 'coming_soon' ? true : 'coming_soon';
      }

      return {
        ...prev,
        featureAccess: { ...prev.featureAccess, [feature]: newValue }
      };
    });
  };

  const handleVisibilityToggle = (field: string) => {
    setFormData((prev: any) => ({
      ...prev,
      visibleFields: { ...prev.visibleFields, [field]: !prev.visibleFields?.[field] }
    }));
  };

  const onSaveClick = async () => {
    setIsSaving(true);
    try {
      let newUsers;
      if (mode === 'edit') {
        newUsers = users.map(u => u.id === formData.id ? formData : u);
      } else {
        newUsers = [...users, formData];
      }
      
      await writeJSON('users.json', newUsers);
      updateUsers(newUsers);
      showToast("User saved successfully ✓", "success");
      onSave(formData);
    } catch (err) {
      console.error(err);
      showToast("Failed to save. Try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const renderTab1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border rounded" />
        <input name="username" value={formData.username || ''} onChange={handleChange} placeholder="Username" className="w-full p-2 border rounded" />
        <input name="password" type="text" value={formData.password || ''} onChange={handleChange} placeholder="Password" className="w-full p-2 border rounded" />
        <select name="role" value={formData.role || ''} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="staff">Staff</option>
        </select>
        <input name="email" value={formData.email || ''} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded" />
        <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Phone" className="w-full p-2 border rounded" />
      </div>
      <div className="flex items-center gap-4">
        <img src={formData.photo} alt="Preview" className="w-12 h-12 rounded-full border bg-gray-100" />
        <input name="photo" value={formData.photo || ''} onChange={handleChange} placeholder="Photo URL" className="flex-1 p-2 border rounded" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded border max-w-[150px]">
        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 accent-yellow-500" />
        <span className="font-semibold">{formData.isActive ? 'Active User' : 'Inactive'}</span>
      </label>
    </div>
  );

  const renderTab2 = () => (
    <div className="space-y-6">
      <div className="p-4 border rounded bg-gray-50">
        <h3 className="font-bold mb-3">✈️ Flight Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <input name="flightNumber" value={formData.flightDetails?.flightNumber || ''} onChange={e => handleNestedChange('flightDetails', e)} placeholder="Flight Number" className="w-full p-2 border rounded" />
          <input name="departureDate" type="date" value={formData.flightDetails?.departureDate || ''} onChange={e => handleNestedChange('flightDetails', e)} className="w-full p-2 border rounded" />
          <input name="departureTime" type="time" value={formData.flightDetails?.departureTime || ''} onChange={e => handleNestedChange('flightDetails', e)} className="w-full p-2 border rounded" />
          <input name="departureAirport" value={formData.flightDetails?.departureAirport || ''} onChange={e => handleNestedChange('flightDetails', e)} placeholder="Departure Airport" className="w-full p-2 border rounded" />
          <input name="arrivalAirport" value={formData.flightDetails?.arrivalAirport || ''} onChange={e => handleNestedChange('flightDetails', e)} placeholder="Arrival Airport" className="w-full p-2 border rounded" />
          <input name="arrivalTime" type="time" value={formData.flightDetails?.arrivalTime || ''} onChange={e => handleNestedChange('flightDetails', e)} className="w-full p-2 border rounded" />
        </div>
      </div>
      <div className="p-4 border rounded bg-gray-50">
        <h3 className="font-bold mb-3">🏨 Hotel Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <input name="name" value={formData.hotel?.name || ''} onChange={e => handleNestedChange('hotel', e)} placeholder="Hotel Name" className="w-full p-2 border rounded" />
          <input name="roomNumber" value={formData.hotel?.roomNumber || ''} onChange={e => handleNestedChange('hotel', e)} placeholder="Room Number" className="w-full p-2 border rounded" />
          <input name="checkIn" type="date" value={formData.hotel?.checkIn || ''} onChange={e => handleNestedChange('hotel', e)} className="w-full p-2 border rounded" />
          <input name="checkOut" type="date" value={formData.hotel?.checkOut || ''} onChange={e => handleNestedChange('hotel', e)} className="w-full p-2 border rounded" />
          <input name="address" value={formData.hotel?.address || ''} onChange={e => handleNestedChange('hotel', e)} placeholder="Address" className="col-span-2 w-full p-2 border rounded" />
          <input name="mapsLink" value={formData.hotel?.mapsLink || ''} onChange={e => handleNestedChange('hotel', e)} placeholder="Google Maps Link" className="col-span-2 w-full p-2 border rounded" />
        </div>
      </div>
    </div>
  );

  const featureList = [
    { key: 'sessions', title: '🎓 Sessions', desc: 'Scientific conference session access' },
    { key: 'schedule', title: '📅 Trip Schedule', desc: 'View trip itinerary' },
    { key: 'social_program', title: '🎉 Social Program', desc: 'Evening events and dinners' },
    { key: 'awards_ceremony', title: '🏆 Awards Ceremony', desc: 'Closing ceremony access' },
    { key: 'photo_gallery', title: '📷 Photo Gallery', desc: 'Event photos' },
    { key: 'documents', title: '📄 Documents', desc: 'Downloadable materials' },
    { key: 'user_management', title: '👥 User Management', desc: 'Admin panel access' }
  ];

  const renderTab3 = () => (
    <div className="space-y-4">
      {featureList.map(feat => {
        const value = formData.featureAccess?.[feat.key];
        const isON = !!value;
        const isFullAccess = value === true;
        return (
          <div key={feat.key} className="bg-[#1a1a1a] text-white p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold">{feat.title}</div>
              <div className="text-gray-400 text-sm">{feat.desc}</div>
              {feat.key === 'user_management' && isON && formData.role !== 'admin' && (
                <div className="text-yellow-500 text-xs mt-1">⚠️ Admin-only feature for a non-admin</div>
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center justify-between bg-gray-900 p-2 rounded">
                <span className="text-sm">Access</span>
                <button onClick={() => handleFeatureToggle(feat.key, 'access')} className={`px-4 py-1 rounded text-sm font-bold transition-colors ${isON ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}>
                  {isON ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className={`flex items-center justify-between bg-gray-900 p-2 rounded transition-opacity ${!isON ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-sm">Status</span>
                <button onClick={() => handleFeatureToggle(feat.key, 'status')} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${isFullAccess ? 'bg-green-600 text-white' : 'border border-yellow-500 text-yellow-500'}`}>
                  {isFullAccess ? 'Full Access' : 'Coming Soon'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const visFields = [
    { key: 'flightDetails', label: '✈️ Flight Details' },
    { key: 'hotel', label: '🏨 Hotel Details' },
    { key: 'transfers', label: '🚌 Transfers Content' },
    { key: 'email', label: '👤 Show Email' },
    { key: 'phone', label: '👤 Show Phone' }
  ];

  const renderTab4 = () => (
    <div className="space-y-4 bg-gray-50 p-4 border rounded">
      <h3 className="font-bold">Select fields visible to this user:</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visFields.map(vf => (
          <label key={vf.key} className="flex items-center gap-3 p-3 bg-white border rounded cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={!!formData.visibleFields?.[vf.key]} onChange={() => handleVisibilityToggle(vf.key)} className="w-5 h-5 accent-yellow-500" />
            <span>{vf.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-2xl font-bold">{mode === 'edit' ? `Edit User — ${formData.name || formData.username}` : 'Create New User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-xl leading-none">✕</button>
        </div>
        
        <div className="flex border-b text-sm font-bold">
          {['Personal Info', 'Travel Details', 'Feature Access', 'Field Visibility'].map((name, i) => (
            <button key={i} onClick={() => setActiveTab(i+1)} className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors ${activeTab === i+1 ? 'border-yellow-500 text-yellow-600 bg-yellow-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
              {name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 1 && renderTab1()}
          {activeTab === 2 && renderTab2()}
          {activeTab === 3 && renderTab3()}
          {activeTab === 4 && renderTab4()}
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} disabled={isSaving} className="px-6 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 font-bold disabled:opacity-50">Cancel</button>
          <button onClick={onSaveClick} disabled={isSaving} className="px-6 py-2 bg-yellow-500 rounded shadow hover:bg-yellow-600 text-black font-bold disabled:opacity-50 flex items-center justify-center min-w-[140px]">
            {isSaving ? <span className="animate-pulse">Saving...</span> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
