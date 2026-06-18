import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";

export const AdminNotificationSender = () => {
  const { users } = useApp() as any;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [iconUrl, setIconUrl] = useState("");
  const [badgeUrl, setBadgeUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  const [routes, setRoutes] = useState<{label: string, path: string}[]>([]);
  const [audience, setAudience] = useState<"all" | "single">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/routes')
      .then(res => res.json())
      .then(setRoutes)
      .catch(console.error);
  }, []);

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const endpoint = audience === "all" ? "/api/push/send-all" : "/api/push/send-user";
      const payload = {
        title,
        body,
        url,
        iconUrl,
        badgeUrl,
        imageUrl,
        ...(audience === "single" && { userId: targetUserId }),
      };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Failed to send notification" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-lg font-bold mb-4">Compose & Send Notification</h2>
      <div className="space-y-4">
        <input className="w-full p-2 border rounded" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full p-2 border rounded" placeholder="Message body" value={body} onChange={(e) => setBody(e.target.value)} />
        
        <div>
          <label className="block text-sm font-medium mb-1">Target Page (Optional):</label>
          <select className="w-full p-2 border rounded" value={url} onChange={(e) => setUrl(e.target.value)}>
            <option value="/">Home</option>
            {routes.map(r => <option key={r.path} value={r.path}>{r.label}</option>)}
          </select>
          <input className="w-full p-2 border rounded mt-2" placeholder="Or custom URL (e.g. /dashboard)" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        
        <input className="w-full p-2 border rounded" placeholder="Icon URL (small, icon)" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="Badge URL (smaller, icon)" value={badgeUrl} onChange={(e) => setBadgeUrl(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="Image URL (large, graphic)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        
        <div>
          <label className="block text-sm font-medium mb-1">Audience:</label>
          <select className="w-full p-2 border rounded" value={audience} onChange={(e) => setAudience(e.target.value as "all" | "single")}>
            <option value="all">All subscribers</option>
            <option value="single">Single user</option>
          </select>
        </div>

        {audience === "single" && (
          <select className="w-full p-2 border rounded" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
            <option value="">Select a user</option>
            {users.map((u: any) => <option key={u.id} value={u.username}>{u.fullname} (@{u.username})</option>)}
          </select>
        )}

        <button 
          onClick={send} 
          disabled={sending || !title || !body || (audience === 'single' && !targetUserId)}
          className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send Notification"}
        </button>
      </div>
      
      {result && (
        <div className="mt-4 p-4 rounded bg-gray-100 text-sm">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
