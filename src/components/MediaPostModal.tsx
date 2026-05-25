import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { compressImage } from '../utils/image';
import { showToast } from './Toast';
import { getThumbnailUrl, detectLinkType } from '../utils/linkUtils';
import { localToUtc, utcToDisplay, TZ_CAIRO, TZ_PRAGUE } from "../utils/timezone";

// COMMENT: Safely formats a UTC ISO string to Cairo local ISO format (YYYY-MM-DDTHH:mm) using standard parts translation.
const getCairoDatetimeLocal = (utcIso: string): string => {
  try {
    const d = new Date(utcIso);
    if (isNaN(d.getTime())) return "";
    
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    
    const val = (type: string) => parts.find(p => p.type === type)?.value || "";
    let hourStr = val("hour");
    if (hourStr === "24") hourStr = "00";
    return `${val("year")}-${val("month")}-${val("day")}T${hourStr}:${val("minute")}`;
  } catch {
    return "";
  }
};

interface MediaPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: any) => Promise<void>;
  post?: any; // If editing
}

export default function MediaPostModal({ isOpen, onClose, onSave, post }: MediaPostModalProps) {
  const { users, settings, DEFAULT_MEDIA_CATEGORIES } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [userSearchText, setUserSearchText] = useState("");
  const [autoThumbnail, setAutoThumbnail] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: "",
    category: "Conference",
    title: "",
    description: "",
    caption: "",
    imageDataUrl: "",
    link: "",
    linkLabel: "",
    allowDownload: true,
    audienceType: "all" as "all" | "roles" | "users",
    audienceRoles: [] as string[],
    audienceUserIds: [] as string[],
    comingSoon: false,
    scheduledAt: null as string | null,
    scheduledAtLocal: "",
    inputTimezone: "Africa/Cairo",
    timezoneDisplay: "both" as "both" | "prague" | "cairo"
  });

  useEffect(() => {
    if (isOpen) {
      if (post) {
        setForm({
          ...post,
          audienceType: post.audienceType || "all",
          audienceRoles: post.audienceRoles || [],
          audienceUserIds: post.audienceUserIds || [],
          comingSoon: post.comingSoon || false,
          scheduledAt: post.scheduledAt || null,
          scheduledAtLocal: post.scheduledAt ? getCairoDatetimeLocal(post.scheduledAt) : "",
          inputTimezone: post.inputTimezone || "Africa/Cairo",
          timezoneDisplay: post.timezoneDisplay || "both"
        });
      } else {
        setForm({
          id: "p" + Date.now(),
          category: settings?.mediaCategories?.[0] || "Conference",
          title: "",
          description: "",
          caption: "",
          imageDataUrl: "",
          link: "",
          linkLabel: "",
          allowDownload: true,
          audienceType: "all",
          audienceRoles: [],
          audienceUserIds: [],
          comingSoon: false,
          scheduledAt: null,
          scheduledAtLocal: "",
          inputTimezone: "Africa/Cairo",
          timezoneDisplay: "both"
        });
      }
    }
  }, [isOpen, post, settings]);

  useEffect(() => {
    if (form.link && !form.imageDataUrl) {
      const thumb = getThumbnailUrl(form.link);
      setAutoThumbnail(thumb);
    } else {
      setAutoThumbnail(null);
    }
  }, [form.link, form.imageDataUrl]);

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      const compressed = await compressImage(file);
      setForm({ ...form, imageDataUrl: compressed });
    } catch (err) {
      showToast("Failed to process image", "error");
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title) {
      showToast("Title is required", "error");
      return;
    }

    if (!form.imageDataUrl && !autoThumbnail) {
      showToast("An image or a link with an auto-fetched preview is required", "error");
      return;
    }

    if (form.audienceType === "roles" && form.audienceRoles.length === 0) {
      showToast("Please select at least one role", "error");
      return;
    }

    if (form.audienceType === "users" && form.audienceUserIds.length === 0) {
      showToast("Please select at least one user", "error");
      return;
    }

    try {
      setIsSaving(true);
      
      const datetime_utc = form.scheduledAtLocal
        ? localToUtc(form.scheduledAtLocal, form.inputTimezone || "Africa/Cairo")
        : null;

      const payload = {
        ...form,
        scheduledAt: datetime_utc,
        photoUrl: form.imageDataUrl || "",
        thumbnailUrl: autoThumbnail || "",
        linkUrl: form.link || "",
        linkType: form.link ? detectLinkType(form.link) : "",
        // For backwards compatibility with standard media lists rendering img tags:
        imageDataUrl: form.imageDataUrl || autoThumbnail || "",
        createdAt: post?.createdAt || new Date().toISOString()
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      showToast("Failed to save post", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearchText.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearchText.toLowerCase())
  );

  const toggleRole = (role: string) => {
    const roles = form.audienceRoles.includes(role)
      ? form.audienceRoles.filter(r => r !== role)
      : [...form.audienceRoles, role];
    setForm({ ...form, audienceRoles: roles });
  };

  const toggleUser = (userId: string) => {
    const ids = form.audienceUserIds.includes(userId)
      ? form.audienceUserIds.filter(id => id !== userId)
      : [...form.audienceUserIds, userId];
    setForm({ ...form, audienceUserIds: ids });
  };

  const categories = settings?.mediaCategories || DEFAULT_MEDIA_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-black text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🖼️</span> {post ? "Edit Media Post" : "Create New Post"}
          </h2>
          <button onClick={onClose} className="text-white hover:text-yellow-400 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Col: Basics */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Post Title</label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Opening Ceremony Highlight"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                <select 
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-bold"
                >
                  {categories.map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Caption (Optional)</label>
                <textarea 
                  value={form.caption}
                  onChange={e => setForm({...form, caption: e.target.value})}
                  placeholder="A short quote or summary..."
                  rows={2}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Link Label</label>
                    <input 
                      type="text" 
                      value={form.linkLabel}
                      onChange={e => setForm({...form, linkLabel: e.target.value})}
                      placeholder="e.g. View Details"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">URL</label>
                    <input 
                      type="url" 
                      value={form.link}
                      onChange={e => setForm({...form, link: e.target.value})}
                      placeholder="https://..."
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                 </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-0.5">
                <input 
                   type="checkbox" 
                   checked={form.allowDownload}
                   onChange={e => setForm({...form, allowDownload: e.target.checked})}
                   className="w-5 h-5 accent-yellow-500"
                />
                <span className="text-sm font-bold text-gray-700">Allow users to download image</span>
              </label>
            </div>

            {/* Right Col: Image & Audience */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Post Image</label>
                <div className="relative group">
                  {form.imageDataUrl ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-100 shadow-inner">
                      <img src={form.imageDataUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setForm({ ...form, imageDataUrl: "" })}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                      <span className="text-3xl mb-2">{compressing ? "⏳" : "📸"}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                        {compressing ? "Processing..." : "Click to Upload Photo"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={compressing} />
                    </label>
                  )}
                </div>

                {/* If no manual photo and autoThumbnail exists, show the preview */}
                {!form.imageDataUrl && autoThumbnail && (
                  <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={autoThumbnail}
                      alt="Link preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2 flex items-center gap-2">
                      <span className="text-white text-xs truncate">{form.link}</span>
                      <span className="ml-auto text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold capitalize flex-shrink-0">
                        {detectLinkType(form.link)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Audience Targeting */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Who can see this post?</label>
                <div className="flex gap-2 mb-4">
                   {[
                     { id: 'all', label: '🌍 Everyone', icon: '🌍' },
                     { id: 'roles', label: '👥 Roles', icon: '👥' },
                     { id: 'users', label: '👤 Users', icon: '👤' }
                   ].map(opt => (
                     <button
                       key={opt.id}
                       onClick={() => {
                         const newType = opt.id as any;
                         if (newType === 'all') {
                           setForm({ ...form, audienceType: newType, audienceRoles: [], audienceUserIds: [] });
                         } else if (newType === 'roles') {
                           setForm({ ...form, audienceType: newType, audienceUserIds: [] });
                         } else if (newType === 'users') {
                           setForm({ ...form, audienceType: newType, audienceRoles: [] });
                         }
                       }}
                       className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                         form.audienceType === opt.id 
                           ? "bg-yellow-500 border-yellow-600 text-black shadow-sm" 
                           : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                       }`}
                     >
                       {opt.label}
                     </button>
                   ))}
                </div>

                {/* Role Selectors */}
                {form.audienceType === "roles" && (
                   <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                     {["admin", "doctor", "staff"].map(role => (
                       <label key={role} className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${form.audienceRoles.includes(role) ? "bg-yellow-50 border-yellow-400 text-yellow-900" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                         <input 
                           type="checkbox"
                           checked={form.audienceRoles.includes(role)}
                           onChange={() => toggleRole(role)}
                           className="accent-yellow-500 w-4 h-4"
                         />
                         <span className="font-bold text-[10px] uppercase tracking-wider">{role}</span>
                       </label>
                     ))}
                   </div>
                )}

                {/* User Selectors */}
                {form.audienceType === "users" && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <input 
                      type="text"
                      placeholder="🔍 Search users..."
                      value={userSearchText}
                      onChange={e => setUserSearchText(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                    <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-1 bg-white">
                      {filteredUsers.map(u => (
                        <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer group">
                           <input 
                             type="checkbox" 
                             checked={form.audienceUserIds.includes(u.id)}
                             onChange={() => toggleUser(u.id)}
                             className="accent-yellow-500 w-4 h-4"
                           />
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{u.name}</p>
                              <p className="text-[10px] text-gray-400 uppercase font-black">{u.role}</p>
                           </div>
                        </label>
                      ))}
                      {filteredUsers.length === 0 && <p className="text-center text-[10px] text-gray-400 py-2">No users found</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Visibility & Timing */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Visibility & Timing</label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.comingSoon}
                    onChange={e => setForm(f => ({ ...f, comingSoon: e.target.checked }))}
                    className="w-4 h-4 accent-yellow-400"
                  />
                  <span className="font-medium text-sm text-gray-800">Mark as "Coming Soon"</span>
                </label>
                <p className="text-[10px] text-gray-500 ml-6 mb-4 font-medium">
                  Hidden from Dashboard. Appears in Gallery with a "Coming Soon" badge.
                </p>

                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={!!form.scheduledAtLocal}
                    onChange={e => setForm(f => ({
                      ...f,
                      scheduledAtLocal: e.target.checked
                        ? getCairoDatetimeLocal(new Date().toISOString())
                        : ""
                    }))}
                    className="w-4 h-4 accent-yellow-400"
                  />
                  <span className="font-medium text-sm text-gray-800">Schedule Publishing</span>
                </label>

                {!!form.scheduledAtLocal && (() => {
                  const [dateInput, timeInput] = form.scheduledAtLocal.split("T");
                  const pragueDisplay = (() => {
                    if (!dateInput || !timeInput) return null;
                    try {
                      const utc = localToUtc(`${dateInput}T${timeInput}`, form.inputTimezone || "Africa/Cairo");
                      return utcToDisplay(utc, TZ_PRAGUE).time;
                    } catch { return null; }
                  })();
                  const cairoDisplay = (() => {
                    if (!dateInput || !timeInput) return null;
                    try {
                      const utc = localToUtc(`${dateInput}T${timeInput}`, form.inputTimezone || "Africa/Cairo");
                      return utcToDisplay(utc, TZ_CAIRO).time;
                    } catch { return null; }
                  })();

                  return (
                    <div className="ml-6 mt-2 animate-in fade-in duration-300 space-y-3">
                      <input
                        type="datetime-local"
                        value={form.scheduledAtLocal}
                        onChange={e => setForm(f => ({
                          ...f,
                          scheduledAtLocal: e.target.value
                        }))}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full font-bold focus:ring-1 focus:ring-yellow-500 outline-none"
                      />
                      
                      {/* Timezone selector */}
                      <div className="flex flex-col gap-1 mt-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">This time is in</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="mediaInputTimezone"
                              value="Africa/Cairo"
                              checked={(form.inputTimezone || "Africa/Cairo") === "Africa/Cairo"}
                              onChange={() => setForm(f => ({ ...f, inputTimezone: "Africa/Cairo" }))}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-700">🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="mediaInputTimezone"
                              value="Europe/Prague"
                              checked={(form.inputTimezone || "Africa/Cairo") === "Europe/Prague"}
                              onChange={() => setForm(f => ({ ...f, inputTimezone: "Europe/Prague" }))}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-700">🇨🇿 Prague</span>
                          </label>
                        </div>
                      </div>

                      {/* Timezone Display Mode Selector */}
                      <div className="flex flex-col gap-1 mt-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Show time to users as</label>
                        <div className="flex flex-col gap-1 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="mediaInputTzDisp"
                              value="both"
                              checked={(form.timezoneDisplay || "both") === "both"}
                              onChange={() => setForm(f => ({ ...f, timezoneDisplay: "both" }))}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-750">🇨🇿 Prague + 🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="mediaInputTzDisp"
                              value="prague"
                              checked={(form.timezoneDisplay || "both") === "prague"}
                              onChange={() => setForm(f => ({ ...f, timezoneDisplay: "prague" }))}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-750">🇨🇿 Prague only</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="mediaInputTzDisp"
                              value="cairo"
                              checked={(form.timezoneDisplay || "both") === "cairo"}
                              onChange={() => setForm(f => ({ ...f, timezoneDisplay: "cairo" }))}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-750">🇪🇬 Cairo only</span>
                          </label>
                        </div>
                      </div>

                      {/* Live preview */}
                      {pragueDisplay && cairoDisplay && (
                        <div className="flex items-center gap-3 mt-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 font-medium">
                          <span>🇨🇿 Prague: <strong>{pragueDisplay}</strong></span>
                          <span className="text-gray-300">|</span>
                          <span>🇪🇬 Cairo: <strong>{cairoDisplay}</strong></span>
                        </div>
                      )}

                      <p className="text-[10px] font-medium text-gray-500 mt-1">
                        Post will not be visible to users until this date and time.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button 
            disabled={isSaving} 
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-bold bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            disabled={isSaving || compressing} 
            onClick={handleSubmit}
            className="flex-1 py-3 bg-yellow-500 border border-yellow-600 text-black rounded-xl font-bold hover:bg-yellow-400 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? "Saving..." : (post ? "Update Post" : "Publish Post")}
          </button>
        </div>
      </div>
    </div>
  );
}
