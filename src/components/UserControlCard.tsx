import React, { useState, useEffect } from 'react';
import { showToast } from './Toast';

const DEFAULT_FEATURE_ACCESS = {
  sessions:       { access: true,  status: "full" },
  schedule:       { access: true,  status: "full" },
  socialProgram:  { access: false, status: "coming_soon" },
  awardsCeremony: { access: false, status: "coming_soon" },
  photoGallery:   { access: false, status: "coming_soon" },
};

const DEFAULT_VISIBLE_FIELDS = {
  departure:    true,
  arrival:      true,
  hotelName:       true,
  hotelAddress:    true,
  checkIn:         true,
  checkOut:        true,
  roomNumber:      true,
  mapsLink:        true,
  transfers:       true,
  email:           true,
  phone:           true,
};

const FEATURES = [
  { key: "sessions",       label: "Sessions",        icon: "🎓",
    desc: "Scientific conference session access" },
  { key: "schedule",       label: "Trip Schedule",   icon: "📅",
    desc: "View trip itinerary" },
  { key: "socialProgram",  label: "Social Program",  icon: "🎉",
    desc: "Evening events and dinners" },
  { key: "awardsCeremony", label: "Awards Ceremony", icon: "🏆",
    desc: "Annual awards event" },
  { key: "photoGallery",   label: "Photo Gallery",   icon: "📷",
    desc: "Conference photos" },
];

const FIELD_SECTIONS = [
  {
    label: "✈️ Flight Details",
    fields: [
      { key: "departure",  label: "Departure Trip" },
      { key: "arrival",    label: "Arrival Trip" },
    ]
  },
  {
    label: "🏨 Hotel Details",
    fields: [
      { key: "hotelName",    label: "Hotel Name" },
      { key: "hotelAddress", label: "Hotel Address" },
      { key: "checkIn",      label: "Check-in Date" },
      { key: "checkOut",     label: "Check-out Date" },
      { key: "roomNumber",   label: "Room Number" },
      { key: "mapsLink",     label: "Google Maps Link" },
    ]
  },
  {
    label: "🚌 Transfers",
    fields: [
      { key: "transfers", label: "Show Transfers Section" },
    ]
  },
  {
    label: "👤 Personal Info",
    fields: [
      { key: "email", label: "Show Email" },
      { key: "phone", label: "Show Phone" },
    ]
  },
];

export default function UserControlCard({ isOpen, mode, user, onClose, onSave }: any) {
  const [activeTab, setActiveTab] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [applyToAllTravel, setApplyToAllTravel] = useState(false);
  const [applyFeaturesToAll, setApplyFeaturesToAll] = useState(false);
  const [applyFieldsToAll, setApplyFieldsToAll] = useState(false);

  const [formData, setFormData] = useState(() => {
    if (mode === "edit" && user) {
      return {
        id:           user.id           || "",
        name:         user.name         || "",
        username:     user.username     || "",
        password:     user.password     || "",
        role:         user.role         || "doctor",
        title:        user.title        || "",
        email:        user.email        || "",
        phone:        user.phone        || "",
        photoUrl:     user.photoUrl     || user.photo || "",
        status:       user.status       ?? true,
      };
    }
    return {
      id:       "u" + Date.now(),
      name:     "",
      username: "",
      password: "",
      role:     "doctor",
      title:    "",
      email:    "",
      phone:    "",
      photoUrl: "",
      status:   true,
    };
  });

  const [travelData, setTravelData] = useState(() => {
    if (mode === "edit" && user) {
      return {
        flightNumber:     user.flightDetails?.flightNumber     || "",
        departureDate:    user.flightDetails?.departureDate    || "",
        departureTime:    user.flightDetails?.departureTime    || "",
        departureAirport: user.flightDetails?.departureAirport || "",
        arrivalAirport:   user.flightDetails?.arrivalAirport   || "",
        arrivalTime:      user.flightDetails?.arrivalTime      || "",
        returnFlight:     user.flightDetails?.returnFlight     || "",
        returnDate:       user.flightDetails?.returnDate       || "",
        returnTime:       user.flightDetails?.returnTime       || "",
        hotelName:        user.hotel?.name                     || "",
        hotelAddress:     user.hotel?.address                  || "",
        checkIn:          user.hotel?.checkIn                  || "",
        checkOut:         user.hotel?.checkOut                 || "",
        roomNumber:       user.hotel?.roomNumber               || "",
        mapsLink:         user.hotel?.mapsLink                 || "",
        transfers:        user.transfers                       || [],
      };
    }
    return {
      flightNumber: "", departureDate: "", departureTime: "",
      departureAirport: "", arrivalAirport: "", arrivalTime: "",
      returnFlight: "", returnDate: "", returnTime: "",
      hotelName: "", hotelAddress: "", checkIn: "",
      checkOut: "", roomNumber: "", mapsLink: "", transfers: [],
    };
  });

  const [featureAccess, setFeatureAccess] = useState(() => {
    if (mode === "edit" && user?.featureAccess) {
      return { ...DEFAULT_FEATURE_ACCESS, ...user.featureAccess };
    }
    return { ...DEFAULT_FEATURE_ACCESS };
  });

  const [visibleFields, setVisibleFields] = useState(() => {
    if (mode === "edit" && user?.visibleFields) {
      return { ...DEFAULT_VISIBLE_FIELDS, ...user.visibleFields };
    }
    return { ...DEFAULT_VISIBLE_FIELDS };
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && user) {
      setFormData({
        id:       user.id       || "",
        name:     user.name     || "",
        username: user.username || "",
        password: user.password || "",
        role:     user.role     || "doctor",
        title:    user.title    || "",
        email:    user.email    || "",
        phone:    user.phone    || "",
        photoUrl: user.photoUrl || user.photo || "",
        status:   user.status   ?? true,
      });

      setTravelData({
        departure: {
          flightNumber:     user.flightDetails?.departure?.flightNumber     || "",
          date:             user.flightDetails?.departure?.date             || "",
          time:             user.flightDetails?.departure?.time             || "",
          departureAirport: user.flightDetails?.departure?.departureAirport || "",
          arrivalAirport:   user.flightDetails?.departure?.arrivalAirport   || "",
          terminal:         user.flightDetails?.departure?.terminal         || "",
          gate:             user.flightDetails?.departure?.gate             || "",
        },
        arrival: {
          flightNumber:     user.flightDetails?.arrival?.flightNumber       || "",
          date:             user.flightDetails?.arrival?.date               || "",
          time:             user.flightDetails?.arrival?.time               || "",
          departureAirport: user.flightDetails?.arrival?.departureAirport || "",
          arrivalAirport:   user.flightDetails?.arrival?.arrivalAirport   || "",
          terminal:         user.flightDetails?.arrival?.terminal           || "",
          gate:             user.flightDetails?.arrival?.gate               || "",
        },
        hotelName:        user.hotel?.name                     || "",
        hotelAddress:     user.hotel?.address                  || "",
        checkIn:          user.hotel?.checkIn                  || "",
        checkOut:         user.hotel?.checkOut                 || "",
        roomNumber:       user.hotel?.roomNumber               || "",
        mapsLink:         user.hotel?.mapsLink                 || "",
        transfers:        user.transfers                       || [],
      });

      setFeatureAccess({
        ...DEFAULT_FEATURE_ACCESS,
        ...(user.featureAccess || {}),
      });

      setVisibleFields({
        ...DEFAULT_VISIBLE_FIELDS,
        ...(user.visibleFields || {}),
      });

    } else if (mode === "create") {
      setFormData({
        id: "u" + Date.now(),
        name: "", username: "", password: "",
        role: "doctor", email: "", phone: "",
        photoUrl: "", status: true,
      });
      setTravelData({
        departure: { flightNumber: "", date: "", time: "", departureAirport: "", arrivalAirport: "", terminal: "", gate: "" },
        arrival: { flightNumber: "", date: "", time: "", departureAirport: "", arrivalAirport: "", terminal: "", gate: "" },
        hotelName: "", hotelAddress: "", checkIn: "",
        checkOut: "", roomNumber: "", mapsLink: "", transfers: [],
      });
      setFeatureAccess({ ...DEFAULT_FEATURE_ACCESS });
      setVisibleFields({ ...DEFAULT_VISIBLE_FIELDS });
    }
    setApplyToAllTravel(false);
  }, [isOpen, user, mode]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleTravelChange = (e: any) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setTravelData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setTravelData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  function toggleFeatureAccess(key: string) {
    setFeatureAccess((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        access: !prev[key]?.access,
      }
    }));
  }

  function setFeatureStatus(key: string, status: string) {
    setFeatureAccess((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
      }
    }));
  }

  function toggleField(key: string) {
    setVisibleFields((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function toggleSection(fields: {key: string}[], value: boolean) {
    const updates: any = {};
    fields.forEach(f => { updates[f.key] = value; });
    setVisibleFields((prev: any) => ({ ...prev, ...updates }));
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      showToast("Full name is required", "error");
      setActiveTab(1);
      return;
    }
    if (!formData.username.trim()) {
      showToast("Username is required", "error");
      setActiveTab(1);
      return;
    }
    if (mode === "create" && !formData.password.trim()) {
      showToast("Password is required", "error");
      setActiveTab(1);
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = {
        ...(mode === "edit" ? user : {}),
        
        id:       formData.id,
        name:     formData.name.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),
        role:     formData.role,
        title:    formData.title.trim(),
        email:    formData.email.trim(),
        phone:    formData.phone.trim(),
        photoUrl: formData.photoUrl.trim(),
        photo:    formData.photoUrl.trim(), // Keep sync with legacy photo field
        status:   formData.status,
        isActive: formData.status, 

        flightDetails: {
          departure: travelData.departure,
          arrival:   travelData.arrival,
        },
        hotel: {
          name:       travelData.hotelName,
          address:    travelData.hotelAddress,
          checkIn:    travelData.checkIn,
          checkOut:   travelData.checkOut,
          roomNumber: travelData.roomNumber,
          mapsLink:   travelData.mapsLink,
        },
        transfers: travelData.transfers,
        featureAccess: { ...featureAccess },
        visibleFields: { ...visibleFields },
      };

      await onSave(updatedUser, applyToAllTravel, applyFeaturesToAll, applyFieldsToAll);

      showToast(
        mode === "edit"
          ? `${updatedUser.name} updated successfully ✓`
          : `${updatedUser.name} created successfully ✓`,
        "success"
      );
      onClose();
    } catch (err) {
      showToast("Failed to save changes. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-2xl font-bold">{mode === 'edit' ? `Edit User — ${formData.name || formData.username}` : 'Create New User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-xl leading-none">✕</button>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap border-b text-sm font-bold">
          {['Personal Info', 'Travel Details', 'Feature Access', 'Field Visibility'].map((name, i) => (
            <button key={i} onClick={() => setActiveTab(i+1)} className={`flex-1 min-w-[120px] py-3 px-4 text-center border-b-2 transition-colors ${activeTab === i+1 ? 'border-yellow-500 text-yellow-600 bg-yellow-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
              {name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border rounded" />
                <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="w-full p-2 border rounded" />
                
                <div className="relative">
                  <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Password" className="w-full p-2 border rounded pr-10" />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    )}
                  </button>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded">
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Job Title</label>
                  <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" className="w-full p-2 border rounded" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Email Address</label>
                  <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full p-2 border rounded" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full p-2 border rounded" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-400 uppercase">Profile Photo URL</label>
                <div className="flex items-center gap-4">
                  {formData.photoUrl ? (
                    <img 
                      src={formData.photoUrl} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-full border bg-gray-100 object-cover shrink-0 shadow-sm" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        e.currentTarget.nextElementSibling?.classList.add('flex');
                      }}
                    />
                  ) : null}
                  <div className={`${formData.photoUrl ? 'hidden' : 'flex'} w-12 h-12 bg-yellow-400 items-center justify-center rounded-full font-bold text-black border border-gray-200 shadow-sm shrink-0`}>
                    {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <input name="photoUrl" value={formData.photoUrl} onChange={handleChange} placeholder="https://example.com/photo.jpg" className="flex-1 p-2 border rounded focus:ring-1 focus:ring-yellow-500 outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded border max-w-[150px]">
                <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} className="w-5 h-5 accent-yellow-500" />
                <span className="font-semibold">{formData.status ? 'Active User' : 'Inactive'}</span>
              </label>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="p-4 border rounded bg-gray-50">
                <h3 className="font-bold mb-3">🛫 Departure Trip (To Prague)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input name="departure.flightNumber" value={travelData.departure?.flightNumber} onChange={handleTravelChange} placeholder="Flight Number" className="w-full p-2 border rounded" />
                  <input name="departure.date" type="date" value={travelData.departure?.date} onChange={handleTravelChange} className="w-full p-2 border rounded" />
                  <input name="departure.time" type="time" value={travelData.departure?.time} onChange={handleTravelChange} className="w-full p-2 border rounded" />
                  <input name="departure.departureAirport" value={travelData.departure?.departureAirport} onChange={handleTravelChange} placeholder="Departure Airport" className="w-full p-2 border rounded" />
                  <input name="departure.arrivalAirport" value={travelData.departure?.arrivalAirport} onChange={handleTravelChange} placeholder="Arrival Airport (PRG)" className="w-full p-2 border rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="departure.terminal" value={travelData.departure?.terminal} onChange={handleTravelChange} placeholder="Terminal" className="w-full p-2 border rounded" />
                    <input name="departure.gate" value={travelData.departure?.gate} onChange={handleTravelChange} placeholder="Gate" className="w-full p-2 border rounded" />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded bg-gray-50">
                <h3 className="font-bold mb-3">🛬 Arrival Trip (Return Home)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input name="arrival.flightNumber" value={travelData.arrival?.flightNumber} onChange={handleTravelChange} placeholder="Flight Number" className="w-full p-2 border rounded" />
                  <input name="arrival.date" type="date" value={travelData.arrival?.date} onChange={handleTravelChange} className="w-full p-2 border rounded" />
                  <input name="arrival.time" type="time" value={travelData.arrival?.time} onChange={handleTravelChange} className="w-full p-2 border rounded" />
                  <input name="arrival.departureAirport" value={travelData.arrival?.departureAirport} onChange={handleTravelChange} placeholder="Departure Airport (PRG)" className="w-full p-2 border rounded" />
                  <input name="arrival.arrivalAirport" value={travelData.arrival?.arrivalAirport} onChange={handleTravelChange} placeholder="Arrival Home Airport" className="w-full p-2 border rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="arrival.terminal" value={travelData.arrival?.terminal} onChange={handleTravelChange} placeholder="Terminal" className="w-full p-2 border rounded" />
                    <input name="arrival.gate" value={travelData.arrival?.gate} onChange={handleTravelChange} placeholder="Gate" className="w-full p-2 border rounded" />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded bg-gray-50">
                <h3 className="font-bold mb-3">🏨 Hotel Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input name="hotelName" value={travelData.hotelName} onChange={handleTravelChange} placeholder="Hotel Name" className="w-full p-2 border rounded" />
                  <input name="roomNumber" value={travelData.roomNumber} onChange={handleTravelChange} placeholder="Room Number" className="w-full p-2 border rounded" />
                  <input name="checkIn" type="date" value={travelData.checkIn} onChange={handleTravelChange} className="w-full p-2 border rounded" />
                  <input name="checkOut" type="date" value={travelData.checkOut} onChange={handleTravelChange} className="w-full p-2 border rounded" />
                  <input name="hotelAddress" value={travelData.hotelAddress} onChange={handleTravelChange} placeholder="Address" className="col-span-2 w-full p-2 border rounded" />
                  <input name="mapsLink" value={travelData.mapsLink} onChange={handleTravelChange} placeholder="Google Maps Link" className="col-span-2 w-full p-2 border rounded" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg max-w-max mx-auto shadow-sm hover:bg-yellow-100 transition-colors">
                <input type="checkbox" name="applyToAllTravel" checked={applyToAllTravel} onChange={(e) => setApplyToAllTravel(e.target.checked)} className="accent-yellow-500 w-5 h-5"/>
                <span className="font-bold text-sm">Apply these travel & hotel details to ALL users</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg max-w-max mx-auto shadow-sm hover:bg-yellow-100 transition-colors">
                <input type="checkbox" name="applyFeaturesToAll" checked={applyFeaturesToAll} onChange={(e) => setApplyFeaturesToAll(e.target.checked)} className="accent-yellow-500 w-5 h-5"/>
                <span className="font-bold text-sm">Apply these feature access settings to ALL users</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg max-w-max mx-auto shadow-sm hover:bg-yellow-100 transition-colors">
                <input type="checkbox" name="applyFieldsToAll" checked={applyFieldsToAll} onChange={(e) => setApplyFieldsToAll(e.target.checked)} className="accent-yellow-500 w-5 h-5"/>
                <span className="font-bold text-sm">Apply these field visibility settings to ALL users</span>
              </label>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-4">
              {FEATURES.map(feature => {
                const fa = featureAccess[feature.key] || { access: false, status: "coming_soon" };
                const isOn = fa.access === true;

                return (
                  <div key={feature.key} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{feature.icon}</span>
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{feature.label}</p>
                          <p className="text-gray-500 text-xs">{feature.desc}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFeatureAccess(feature.key)}
                        className={`relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none border ${isOn ? "bg-yellow-500 border-yellow-600" : "bg-gray-200 border-gray-300"}`}
                      >
                        <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${isOn ? "translate-x-8" : "translate-x-1"}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">Access:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOn ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-gray-200 text-gray-600 border border-gray-300"}`}>
                        {isOn ? "ON" : "OFF"}
                      </span>
                    </div>
                    {isOn && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">Status:</span>
                        <select
                          value={fa.status || "full"}
                          onChange={e => setFeatureStatus(feature.key, e.target.value)}
                          className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        >
                          <option value="full">✅ Full Access</option>
                          <option value="coming_soon">🔒 Coming Soon</option>
                        </select>
                        {fa.status === "full" && (
                          <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full">Full Access</span>
                        )}
                        {fa.status === "coming_soon" && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">Coming Soon</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 4 && (
            <div className="space-y-4">
              {FIELD_SECTIONS.map(section => (
                <div key={section.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="text-gray-900 font-bold text-sm">{section.label}</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.fields, true)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        All
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        type="button"
                        onClick={() => toggleSection(section.fields, false)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-semibold"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {section.fields.map(field => (
                      <label key={field.key} className="flex items-center gap-2 cursor-pointer group hover:bg-gray-100 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={visibleFields[field.key] !== false}
                          onChange={() => toggleField(field.key)}
                          className="w-4 h-4 accent-yellow-500 cursor-pointer"
                        />
                        <span className="text-gray-700 text-sm group-hover:text-gray-900 transition-colors font-medium">
                          {field.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} disabled={isSaving} className="px-6 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 font-bold disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-yellow-500 rounded shadow hover:bg-yellow-600 text-black font-bold disabled:opacity-50 flex items-center justify-center min-w-[140px]">
            {isSaving ? <span className="animate-pulse">Saving...</span> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
