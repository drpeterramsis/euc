import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Loader2 } from "lucide-react";

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
  const [persistedTags, setPersistedTags] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("push_tags");
    if(saved) setPersistedTags(JSON.parse(saved));
    
    fetch('/api/admin/routes')
      .then(res => res.json())
      .then(setRoutes)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!sending) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // standard spec for beforeunload message: modern browsers do not show actual custom text but ask for confirmation.
      e.returnValue = "Please don't reload or close this page until it finishes.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sending]);

  const selectTag = (tag: any) => {
    setTitle(tag.title);
    setBody(tag.body);
    setUrl(tag.url);
    setIconUrl(tag.iconUrl || "");
    setBadgeUrl(tag.badgeUrl || "");
    setImageUrl(tag.imageUrl || "");
  };

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
      
      const sessionRaw = localStorage.getItem("euc_user");
      let headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (sessionRaw) {
        try {
          const userObj = JSON.parse(sessionRaw);
          headers["Authorization"] = `Bearer ${sessionRaw}`;
          headers["X-User-Role"] = userObj.role || "";
          headers["X-User-Id"] = userObj.id || "";
          headers["X-User-Username"] = userObj.username || "";
        } catch (e) {
          console.error("Failed to parse euc_user session for headers", e);
        }
      }
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...payload,
          session: sessionRaw ? JSON.parse(sessionRaw) : null
        }),
      });

      if (res.status === 401) {
        setResult({ error: "401 Unauthorized: Session is missing or has expired. Please try logging out and signing in again." });
        return;
      }
      if (res.status === 403) {
        setResult({ error: "403 Forbidden: Administrative permission is required to broadcast notifications." });
        return;
      }

      const data = await res.json();
      
      const newTag = { title, body, url, iconUrl, badgeUrl, imageUrl };
      const updatedTags = [newTag, ...persistedTags.filter(t => JSON.stringify(t) !== JSON.stringify(newTag))];
      setPersistedTags(updatedTags);
      localStorage.setItem("push_tags", JSON.stringify(updatedTags));
      
      setResult(data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      setResult({ error: "Failed to send notification" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 relative">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-bold">Notification Sent!</h3>
            <p className="text-gray-600 mt-2">The notification was broadcasted successfully.</p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Full screen sending block overlay modal */}
      {sending && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                Sending notification…
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Broadcasting messages to registered devices.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-100 rounded-xl text-xs font-semibold leading-relaxed">
              ⚠️ Please don’t reload or close this page until it finishes.
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold mb-4">Compose & Send Notification</h2>
      
      {persistedTags.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Reuse Previous Tags:</label>
          <select 
            className="w-full p-2 border rounded"
            onChange={(e) => {
              const tag = persistedTags[parseInt(e.target.value)];
              if (tag) selectTag(tag);
            }}
          >
            <option value="">Select a previous configuration...</option>
            {persistedTags.map((t, i) => (
              <option key={i} value={i}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-4">
        <input 
          className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400" 
          placeholder="Title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          disabled={sending}
        />
        <textarea 
          className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400" 
          placeholder="Message body" 
          value={body} 
          onChange={(e) => setBody(e.target.value)} 
          disabled={sending}
        />
        
        <div>
          <label className="block text-sm font-medium mb-1">Target Page (Optional):</label>
          <select 
            className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            disabled={sending}
          >
            <option value="/">Home</option>
            {routes.map(r => <option key={r.path} value={r.path}>{r.label}</option>)}
          </select>
          <input 
            className="w-full p-2 border rounded mt-2 disabled:bg-gray-50 disabled:text-gray-400" 
            placeholder="Or custom URL (e.g. /dashboard)" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            disabled={sending}
          />
        </div>
        
        <input 
          className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400" 
          placeholder="Icon URL (small, icon)" 
          value={iconUrl} 
          onChange={(e) => setIconUrl(e.target.value)} 
          disabled={sending}
        />
        <input 
          className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400" 
          placeholder="Badge URL (smaller, icon)" 
          value={badgeUrl} 
          onChange={(e) => setBadgeUrl(e.target.value)} 
          disabled={sending}
        />
        <input 
          className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400" 
          placeholder="Image URL (large, graphic)" 
          value={imageUrl} 
          onChange={(e) => setImageUrl(e.target.value)} 
          disabled={sending}
        />
        
        <div>
          <label className="block text-sm font-medium mb-1">Audience:</label>
          <select 
            className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400" 
            value={audience} 
            onChange={(e) => setAudience(e.target.value as "all" | "single")}
            disabled={sending}
          >
            <option value="all">All subscribers</option>
            <option value="single">Single user</option>
          </select>
        </div>

        {audience === "single" && (
          <select 
            className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400" 
            value={targetUserId} 
            onChange={(e) => setTargetUserId(e.target.value)}
            disabled={sending}
          >
            <option value="">Select a user</option>
            {users.map((u: any) => <option key={u.id} value={u.username}>{u.fullname} (@{u.username})</option>)}
          </select>
        )}

        <button 
          onClick={send} 
          disabled={sending || !title || !body || (audience === 'single' && !targetUserId)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors w-full sm:w-auto"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending Broadcast... Please wait</span>
            </>
          ) : (
            "Send Notification"
          )}
        </button>
      </div>
      
      {sending && (
        <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 border border-yellow-100 rounded text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
          <span>Broadcasting push subscription notifications. Please do not close or refresh this page. This could take up to a minute depending on target list size.</span>
        </div>
      )}
      
      {result && result.error && (
        <div className="mt-4 p-4 rounded bg-red-100 text-red-800 text-sm">
          {result.error}
        </div>
      )}
    </div>
  );
};
