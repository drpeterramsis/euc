import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { writeJSON } from "../../utils/github";

export default function AdminMessages() {
  const { messages, setMessages } = useApp() as any;
  const [editingMsg, setEditingMsg] = useState<any>(null);

  const [form, setForm] = useState({
    title: "",
    body: "",
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
    setForm({
      title: msg.title || "",
      body: msg.body || "",
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
    setForm({
      title: "",
      body: "",
      priority: "normal",
      audience: "all",
      scheduledAt: "",
      expiresAt: "",
      pinned: false,
      buttons: []
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete message?")) return;
    const updated = messages.filter((m: any) => m.id !== id);
    setMessages(updated);
    await writeJSON("messages.json", updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    let status = "draft";
    let publishedAt = null;

    if (form.scheduledAt) {
      const sDate = new Date(form.scheduledAt).toISOString();
      if (sDate <= now) {
        status = "published";
        publishedAt = now;
      } else {
        status = "scheduled";
      }
    }

    if (form.expiresAt) {
      const eDate = new Date(form.expiresAt).toISOString();
      if (eDate <= now && status === "published") {
        status = "expired";
      }
    }

    const payload = {
      id: editingMsg?.id === "new" ? `msg_${Date.now()}` : editingMsg.id,
      title: form.title,
      body: form.body,
      status,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      publishedAt: editingMsg.publishedAt || publishedAt,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      priority: form.priority,
      audience: form.audience,
      buttons: form.buttons,
      createdBy: "admin",
      readBy: editingMsg.readBy || [],
      pinned: form.pinned
    };

    let updated = [...messages];
    if (editingMsg?.id === "new") {
      updated.push(payload);
    } else {
      const idx = updated.findIndex((m: any) => m.id === payload.id);
      if (idx !== -1) updated[idx] = payload;
    }

    setMessages(updated);
    await writeJSON("messages.json", updated);
    setEditingMsg(null);
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
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Priority</label>
                 <div className="flex gap-4">
                   <label className="flex items-center gap-1 text-sm font-medium"><input type="radio" value="normal" checked={form.priority === "normal"} onChange={e => setForm({...form, priority: e.target.value})} /> Normal</label>
                   <label className="flex items-center gap-1 text-sm font-medium"><input type="radio" value="high" checked={form.priority === "high"} onChange={e => setForm({...form, priority: e.target.value})} /> High</label>
                 </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Pinned</label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
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
                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Scheduled At (Leave empty for Draft)</label>
                 <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium" />
               </div>
               <div>
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
                <div key={i} className="flex gap-2 items-center mb-2">
                  <input placeholder="Label" value={btn.label} onChange={e => { const b = [...form.buttons]; b[i].label = e.target.value; setForm({...form, buttons: b}); }} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
                  <input placeholder="Link (/route or https://...)" value={btn.link} onChange={e => { const b = [...form.buttons]; b[i].link = e.target.value; setForm({...form, buttons: b}); }} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
                  <select value={btn.style} onChange={e => { const b = [...form.buttons]; b[i].style = e.target.value as any; setForm({...form, buttons: b}); }} className="w-32 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm">
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="ghost">Ghost</option>
                  </select>
                  <button type="button" onClick={() => { const b = [...form.buttons]; b.splice(i, 1); setForm({...form, buttons: b}); }} className="text-red-500 font-bold px-2">X</button>
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
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-bold tracking-wider">
                 <tr>
                    <th className="p-4">Title</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Audience</th>
                    <th className="p-4">Scheduled</th>
                    <th className="p-4">Pinned</th>
                    <th className="p-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {messages.map((m: any) => {
                   let badgeCls = "bg-gray-100 text-gray-600";
                   if (m.status === "scheduled") badgeCls = "bg-blue-100 text-blue-700";
                   if (m.status === "published") badgeCls = "bg-green-100 text-green-700";
                   if (m.status === "expired") badgeCls = "bg-red-100 text-red-600";
                   if (m.status === "archived") badgeCls = "bg-gray-200 text-gray-500";
                   
                   return (
                     <tr key={m.id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-900">{m.title}</td>
                        <td className="p-4 capitalize">{m.priority}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${badgeCls}`}>{m.status}</span>
                        </td>
                        <td className="p-4 capitalize">{m.audience}</td>
                        <td className="p-4 text-gray-500 whitespace-nowrap">{m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "—"}</td>
                        <td className="p-4">{m.pinned ? "📌" : ""}</td>
                        <td className="p-4 text-right space-x-3">
                          <button onClick={() => handleEdit(m)} className="text-gray-400 hover:text-black transition-colors" title="Edit">
                             <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                             <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                     </tr>
                   );
                 })}
                 {messages.length === 0 && (
                   <tr><td colSpan={7} className="p-8 text-center text-gray-400 font-bold italic">No messages found.</td></tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
