import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { writeJSON } from "../../utils/github";

export default function AdminMessages() {
  const { messages, updateMessages } = useApp() as any;
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [publishMode, setPublishMode] = useState<"now"|"schedule">("now");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "general",
    priority: "normal",
    audience: "all",
    scheduledAt: "",
    expiresAt: "",
    pinned: false,
    buttons: [] as any[]
  });

  if (!messages) return <div className="p-8 text-center text-gray-500 font-bold">Loading Messages...</div>;

  const handleEdit = (msg: any) => {
    setEditingMsg(msg);
    setPublishMode(msg.status === "scheduled" || (msg.scheduledAt && msg.scheduledAt > new Date().toISOString()) ? "schedule" : "now");
    setForm({
      title: msg.title || "",
      body: msg.body || "",
      category: msg.category || "general",
      priority: msg.priority || "normal",
      audience: msg.audience || "all",
      scheduledAt: msg.scheduledAt ? new Date(msg.scheduledAt).toISOString().slice(0, 16) : "",
      expiresAt: msg.expiresAt ? new Date(msg.expiresAt).toISOString().slice(0, 16) : "",
      pinned: msg.pinned || false,
      buttons: msg.buttons ? JSON.parse(JSON.stringify(msg.buttons)) : []
    });
  };

  const initNew = () => {
    setEditingMsg({ id: "new" });
    setPublishMode("now");
    setForm({
      title: "",
      body: "",
      category: "general",
      priority: "normal",
      audience: "all",
      scheduledAt: "",
      expiresAt: "",
      pinned: false,
      buttons: []
    });
  };

  const handleDelete = async (id: string) => {
    setMessageToDelete(id);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;
    const updated = messages.filter((m: any) => m.id !== messageToDelete);
    updateMessages(updated);
    setMessageToDelete(null);
    await writeJSON("messages.json", updated).catch(()=>null);
  };

  const cancelDelete = () => {
    setMessageToDelete(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    let status = "draft";
    let publishedAt = editingMsg?.publishedAt || null;
    let scheduledAt = form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null;

    if (publishMode === "now") {
        status = "published";
        publishedAt = publishedAt || now;
        scheduledAt = null;
    } else {
        if (scheduledAt) {
            if (scheduledAt <= now) {
                status = "published";
                publishedAt = scheduledAt;
            } else {
                status = "scheduled";
            }
        }
    }

    if (form.expiresAt) {
      const eDate = new Date(form.expiresAt).toISOString();
      if (eDate <= now && status === "published") {
        status = "expired";
      }
    }

    const payload = {
      id: editingMsg?.id === "new" ? crypto.randomUUID?.() || `msg_${Date.now()}` : editingMsg.id,
      title: form.title,
      body: form.body,
      category: form.category,
      status,
      scheduledAt,
      publishedAt,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      priority: form.priority,
      audience: form.audience,
      buttons: form.buttons,
      createdBy: "admin",
      readBy: editingMsg?.readBy || [],
      pinned: form.pinned
    };

    let updated = [...messages];
    if (editingMsg?.id === "new") {
      updated = [payload, ...updated];
    } else {
      const idx = updated.findIndex((m: any) => m.id === payload.id);
      if (idx !== -1) updated[idx] = payload;
    }

    updateMessages(updated);
    setEditingMsg(null);
    await writeJSON("messages.json", updated).catch(()=>null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Message Center</h2>
        {!editingMsg && (
          <button onClick={initNew} className="bg-black text-white hover:bg-gray-800 rounded-lg px-4 py-2 font-bold text-sm transition-colors">
            + New Message
          </button>
        )}
      </div>

      {editingMsg ? (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Body *</label>
              <textarea required rows={4} value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Category</label>
                 <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-yellow-500 focus:border-yellow-500">
                   <option value="general">General</option>
                   <option value="schedule">Schedule</option>
                   <option value="logistics">Logistics</option>
                   <option value="urgent">Urgent</option>
                   <option value="social">Social</option>
                   <option value="other">Other</option>
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Priority</label>
                 <div className="flex gap-4 mt-2">
                   <label className="flex items-center gap-1 text-sm font-medium"><input type="radio" value="normal" checked={form.priority === "normal"} onChange={e => setForm({...form, priority: e.target.value})} /> Normal</label>
                   <label className="flex items-center gap-1 text-sm font-medium"><input type="radio" value="high" checked={form.priority === "high"} onChange={e => setForm({...form, priority: e.target.value})} /> High</label>
                 </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Pinned</label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mt-2">
                    <input type="checkbox" checked={form.pinned} onChange={e => setForm({...form, pinned: e.target.checked})} className="rounded text-black focus:ring-black rounded-sm" />
                    Stick to top of priority group
                  </label>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Audience</label>
                 <select value={form.audience} onChange={e => setForm({...form, audience: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-yellow-500 focus:border-yellow-500">
                   <option value="all">All Users</option>
                   <option value="doctors">Doctors</option>
                   <option value="admins">Admins</option>
                 </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Publishing</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1 text-sm font-medium"><input type="radio" value="now" checked={publishMode === "now"} onChange={() => setPublishMode("now")} /> Publish Now</label>
                    <label className="flex items-center gap-1 text-sm font-medium"><input type="radio" value="schedule" checked={publishMode === "schedule"} onChange={() => setPublishMode("schedule")} /> Schedule</label>
                  </div>
               </div>
               {publishMode === "schedule" && (
                 <div>
                   <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Scheduled At *</label>
                   <input required type="datetime-local" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium" />
                 </div>
               )}
               <div className={publishMode === "now" ? "md:col-start-3" : ""}>
                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Expires At</label>
                 <input type="datetime-local" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium" />
               </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Buttons Builders</label>
                {form.buttons.length < 3 && (
                  <button type="button" onClick={() => setForm({...form, buttons: [...form.buttons, { label: "", link: "", style: "primary" }]})} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded font-bold">
                    + Add Button
                  </button>
                )}
              </div>
              {form.buttons.map((btn, i) => (
                <div key={i} className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input placeholder="Label" value={btn.label} onChange={e => { const b = [...form.buttons]; b[i].label = e.target.value; setForm({...form, buttons: b}); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
                    <input placeholder="Link (/route or https://...)" value={btn.link} onChange={e => { const b = [...form.buttons]; b[i].link = e.target.value; setForm({...form, buttons: b}); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
                    <select value={btn.style} onChange={e => { const b = [...form.buttons]; b[i].style = e.target.value as any; setForm({...form, buttons: b}); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm">
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="ghost">Ghost</option>
                    </select>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={() => { const b = [...form.buttons]; b.splice(i, 1); setForm({...form, buttons: b}); }} className="text-red-500 text-xs font-bold hover:text-red-700 transition-colors">
                      Remove Button
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4">
              <button type="button" onClick={() => setEditingMsg(null)} className="px-4 py-2 font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg">Cancel</button>
              <button type="submit" className="px-6 py-2 font-bold text-sm bg-black hover:bg-gray-800 text-white rounded-lg">Save Message</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {messages.map((m: any) => {
             let badgeCls = "bg-gray-100 text-gray-600";
             if (m.status === "scheduled") badgeCls = "bg-blue-100 text-blue-700";
             if (m.status === "published") badgeCls = "bg-green-100 text-green-700";
             if (m.status === "expired") badgeCls = "bg-red-100 text-red-600";
             if (m.status === "archived") badgeCls = "bg-gray-200 text-gray-500";
             
             return (
               <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 flex flex-col justify-between">
                 <div>
                   <div className="flex justify-between items-start gap-2 mb-2">
                     <h3 className="font-bold text-gray-900 leading-tight flex-1 break-words">{m.title}</h3>
                     {m.pinned && <span className="text-sm">📌</span>}
                   </div>
                   <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                      <span className={`px-2 py-1 rounded ${badgeCls}`}>{m.status}</span>
                      <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded">{m.priority}</span>
                      {m.category && <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded">{m.category}</span>}
                   </div>
                   <p className="text-xs text-gray-500 line-clamp-2">{m.body}</p>
                 </div>
                 <div className="border-t border-gray-50 pt-3 mt-3 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex flex-col gap-1">
                      <span>Audience: <strong className="capitalize text-gray-700">{m.audience}</strong></span>
                      {m.scheduledAt && <span>Sched: <strong className="text-gray-700">{new Date(m.scheduledAt).toLocaleString()}</strong></span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleEdit(m)} className="text-gray-400 hover:text-black transition-colors" title="Edit">
                         <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                         <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                 </div>
               </div>
             );
           })}
           {messages.length === 0 && (
             <div className="col-span-full p-8 text-center text-gray-400 font-bold italic">No messages found.</div>
           )}
        </div>
      )}

      {messageToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
             <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Message</h3>
             <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this message? This action cannot be undone.</p>
             <div className="flex gap-3">
               <button onClick={cancelDelete} className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors border-none cursor-pointer">Cancel</button>
               <button onClick={confirmDelete} className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors border-none cursor-pointer">Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
