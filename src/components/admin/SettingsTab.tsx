import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { writeJSON } from "../../utils/github";

export default function SettingsTab() {
  const { content, updateContent, users, appConfig } = useApp() as any;

  // Initialize settings defaults if they look blank
  const currentSettings = content?.settings || {
    pages: {
      announcements: { enabled: true, comingSoon: false },
      agenda:        { enabled: true, comingSoon: false },
      posts:         { enabled: true, comingSoon: false },
      media:         { enabled: true, comingSoon: false },
      staffDirectory: { enabled: true, comingSoon: false }
    },
    userOverrides: {},
    roleOverrides: {} // FIX: Initialize roleOverrides
  };

  const pagesList = ["announcements", "agenda", "posts", "media", "staffDirectory"];

  // Local state representing the complete active settings
  const [localSettings, setLocalSettings] = useState(() => {
    // Deep clone current settings
    return JSON.parse(JSON.stringify(currentSettings));
  });

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Section C: Change Role-Specific Toggle
  const handleRoleToggle = (page: string, field: "enabled" | "comingSoon") => {
    if (!selectedRole) return;
    setLocalSettings((prev: any) => {
      const overrides = { ...(prev.roleOverrides || {}) };
      const roleOverride = overrides[selectedRole.toLowerCase()] || { pages: {} };
      const overridePages = { ...(roleOverride.pages || {}) };
      
      let baseVal = overridePages[page];
      if (baseVal === undefined) {
        baseVal = prev.pages?.[page] || { enabled: true, comingSoon: false };
      }

      overridePages[page] = {
        ...baseVal,
        [field]: !baseVal[field]
      };

      overrides[selectedRole.toLowerCase()] = {
        ...roleOverride,
        pages: overridePages
      };

      return { ...prev, roleOverrides: overrides };
    });
  };

  // Section C: Reset Role to Global config
  const handleResetRoleToGlobal = () => {
    if (!selectedRole) return;
    setLocalSettings((prev: any) => {
      const overrides = { ...(prev.roleOverrides || {}) };
      delete overrides[selectedRole.toLowerCase()];
      return { ...prev, roleOverrides: overrides };
    });
    setSaveStatus({ type: "success", message: "Role override deleted locally. Save to persist changes." });
  };

  // Get active role state
  const getRolePageState = (page: string) => {
    if (!selectedRole) return { enabled: true, comingSoon: false, isOverride: false };
    const overrideVal = localSettings.roleOverrides?.[selectedRole.toLowerCase()]?.pages?.[page];
    if (overrideVal !== undefined) {
      return { ...overrideVal, isOverride: true };
    }
    const globalVal = localSettings.pages?.[page] || { enabled: true, comingSoon: false };
    return { ...globalVal, isOverride: false };
  };

  // Helper to format page labels nicely
  const getPageLabel = (page: string) => {
    const navLabels = appConfig?.navLabels || {};
    switch (page) {
      case "announcements": return `💬 ${navLabels.dashboard || "Home Page"} (Messages)`;
      case "agenda": return `📅 ${navLabels.schedule || "Schedule"} (Sessions/Schedule)`;
      case "posts": return `📝 ${navLabels.sessions || "Sessions"} (Blog/Stream)`;
      case "media": return `🎥 ${navLabels.media || "News Feed"} (Audio/Video)`;
      case "staffDirectory": return `👥 ${navLabels.directory || "Staff Directory"}`;
      default: return page.charAt(0).toUpperCase() + page.slice(1);
    }
  };

  // Section A: Change Global Toggle
  const handleGlobalToggle = (page: string, field: "enabled" | "comingSoon") => {
    setLocalSettings((prev: any) => {
      const currentPages = { ...(prev.pages || {}) };
      const pageData = { ...(currentPages[page] || { enabled: true, comingSoon: false }) };
      pageData[field] = !pageData[field];
      currentPages[page] = pageData;
      return { ...prev, pages: currentPages };
    });
  };

  // Section B: Change User-Specific Toggle
  const handleUserToggle = (page: string, field: "enabled" | "comingSoon") => {
    if (!selectedUserId) return;
    setLocalSettings((prev: any) => {
      const overrides = { ...(prev.userOverrides || {}) };
      const userOverride = overrides[selectedUserId] || { pages: {} };
      const overridePages = { ...(userOverride.pages || {}) };
      
      // Determine existing value
      let baseVal = overridePages[page];
      if (baseVal === undefined) {
        // Fallback to the live global value in localSettings
        baseVal = prev.pages?.[page] || { enabled: true, comingSoon: false };
      }

      overridePages[page] = {
        ...baseVal,
        [field]: !baseVal[field]
      };

      overrides[selectedUserId] = {
        ...userOverride,
        pages: overridePages
      };

      return { ...prev, userOverrides: overrides };
    });
  };

  // Section B: Reset User to Global config
  const handleResetToGlobal = () => {
    if (!selectedUserId) return;
    setLocalSettings((prev: any) => {
      const overrides = { ...(prev.userOverrides || {}) };
      delete overrides[selectedUserId];
      return { ...prev, userOverrides: overrides };
    });
    setSaveStatus({ type: "success", message: "User override deleted locally. Save to persist changes." });
  };

  // Get active user state for display
  const getUserPageState = (page: string) => {
    if (!selectedUserId) return { enabled: true, comingSoon: false, isOverride: false };
    const overrideVal = localSettings.userOverrides?.[selectedUserId]?.pages?.[page];
    if (overrideVal !== undefined) {
      return { ...overrideVal, isOverride: true };
    }
    // Return live global default values
    const globalVal = localSettings.pages?.[page] || { enabled: true, comingSoon: false };
    return { ...globalVal, isOverride: false };
  };

  // Save Settings
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus(null);

      // Construct final content ensuring settings is correct
      const updatedContent = {
        ...(content || {}),
        settings: localSettings
      };

      // Write content.json through existing writeJSON wrapper
      await writeJSON("content.json", updatedContent);
      
      // Update app provider state immediately
      updateContent(updatedContent);

      setSaveStatus({ type: "success", message: "Page visibility settings saved successfully!" });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e: any) {
      console.error(e);
      setSaveStatus({ type: "error", message: `Failed to save changes: ${e.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">🔒 Page Visibility System</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Configure global and per-user access limits</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-tight border shadow-xs transition-all cursor-pointer ${
            isSaving 
              ? "bg-gray-100 text-gray-400 border-gray-200" 
              : "bg-black text-white hover:bg-yellow-500 hover:text-black border-black cursor-pointer"
          }`}
        >
          {isSaving ? "⏳ Saving Changes..." : "💾 Save Settings"}
        </button>
      </div>

      {saveStatus && (
        <div className={`mb-6 p-4 rounded-xl border font-semibold text-sm ${
          saveStatus.type === "success" 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {saveStatus.message}
        </div>
      )}

      {/* SECTION A: GLOBAL DEFAULTS */}
      <div className="mb-10">
        <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
          Section A — Global Defaults
        </h3>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-150 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150">
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Page Name</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Enabled</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Coming Soon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagesList.map((page) => {
                const config = localSettings.pages?.[page] || { enabled: true, comingSoon: false };
                return (
                  <tr key={page} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{getPageLabel(page)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleGlobalToggle(page, "enabled")}
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${
                          config.enabled
                            ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                            : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {config.enabled ? "✅ Enabled" : "❌ Disabled"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleGlobalToggle(page, "comingSoon")}
                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${
                          config.comingSoon
                            ? "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
                            : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {config.comingSoon ? "🛡️ Coming Soon" : "🚀 Active"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards */}
        <div className="block md:hidden space-y-3">
          {pagesList.map((page) => {
            const config = localSettings.pages?.[page] || { enabled: true, comingSoon: false };
            return (
              <div key={page} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                  <span>{getPageLabel(page)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Enabled</span>
                  <button onClick={() => handleGlobalToggle(page, "enabled")} className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${config.enabled ? "bg-green-100 border-green-300 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>{config.enabled ? "✅ Enabled" : "❌ Disabled"}</button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Coming Soon</span>
                  <button onClick={() => handleGlobalToggle(page, "comingSoon")} className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${config.comingSoon ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-gray-100 border-gray-200 text-gray-500"}`}>{config.comingSoon ? "🛡️ Coming Soon" : "🚀 Active"}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION B: PER-USER OVERRIDE */}
      <div className="mb-10">
        <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
          Section B — Per-User Override
        </h3>

        <div className="bg-gray-50 rounded-2xl border border-gray-150 p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Select User to Customize</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full sm:max-w-xs border border-gray-250 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            >
              <option value="">-- Choose User --</option>
              {users && users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  👤 {u.name || u.username} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {selectedUserId && (
            <button
              onClick={handleResetToGlobal}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 bg-white hover:bg-red-50 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs self-end sm:self-center"
            >
              🔄 Reset to Global
            </button>
          )}
        </div>

        {selectedUserId ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-150 shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150">
                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Page Name</th>
                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Override Status</th>
                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Enabled</th>
                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Coming Soon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagesList.map((page) => {
                    const state = getUserPageState(page);
                    return (
                      <tr key={page} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-800">{getPageLabel(page)}</td>
                        <td className="p-4 text-center">
                          {state.isOverride ? (
                            <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-yellow-100 border border-yellow-300 text-yellow-800">
                              ⭐ Customized
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-gray-100 border border-gray-200 text-gray-400">
                              🌐 Global Default
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleUserToggle(page, "enabled")}
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${
                              state.enabled
                                ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            {state.enabled ? "✅ Enabled" : "❌ Disabled"}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleUserToggle(page, "comingSoon")}
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${
                              state.comingSoon
                                ? "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
                                : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {state.comingSoon ? "🛡️ Coming Soon" : "🚀 Active"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {pagesList.map((page) => {
                const state = getUserPageState(page);
                return (
                  <div key={page} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                      <span>{getPageLabel(page)}</span>
                      {state.isOverride ? <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase bg-yellow-100 text-yellow-800">⭐</span> : <span className="text-[10px] text-gray-400">🌐</span>}
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Enabled</span>
                      <button onClick={() => handleUserToggle(page, "enabled")} className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${state.enabled ? "bg-green-100 border-green-300 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>{state.enabled ? "✅ Enabled" : "❌ Disabled"}</button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Coming Soon</span>
                      <button onClick={() => handleUserToggle(page, "comingSoon")} className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${state.comingSoon ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-gray-100 border-gray-200 text-gray-500"}`}>{state.comingSoon ? "🛡️ Coming Soon" : "🚀 Active"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400 font-bold uppercase tracking-wide">
            Select a user from the dropdown above to view or customize their configuration
          </div>
        )}
      </div>

      {/* SECTION C: PER-ROLE OVERRIDE */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
          Section C — Per-Role Override
        </h3>

        <div className="bg-gray-50 rounded-2xl border border-gray-150 p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Select Role to Customize</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full sm:max-w-xs border border-gray-250 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            >
              <option value="">-- Choose Role --</option>
              {["admin", "doctor", "staff"].map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {selectedRole && (
            <button
              onClick={handleResetRoleToGlobal}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 bg-white hover:bg-red-50 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs self-end sm:self-center"
            >
              🔄 Reset to Global
            </button>
          )}
        </div>

        {selectedRole ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-150 shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150">
                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Page Name</th>
                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Override Status</th>
                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Enabled</th>
                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Coming Soon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagesList.map((page) => {
                    const state = getRolePageState(page);
                    return (
                      <tr key={page} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-800">{getPageLabel(page)}</td>
                        <td className="p-4 text-center">
                          {state.isOverride ? (
                            <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-yellow-100 border border-yellow-300 text-yellow-800">
                              ⭐ Customized
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-gray-100 border border-gray-200 text-gray-400">
                              🌐 Global Default
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleRoleToggle(page, "enabled")}
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${
                              state.enabled
                                ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            {state.enabled ? "✅ Enabled" : "❌ Disabled"}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleRoleToggle(page, "comingSoon")}
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${
                              state.comingSoon
                                ? "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
                                : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {state.comingSoon ? "🛡️ Coming Soon" : "🚀 Active"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {pagesList.map((page) => {
                const state = getRolePageState(page);
                return (
                  <div key={page} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                      <span>{getPageLabel(page)}</span>
                      {state.isOverride ? <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase bg-yellow-100 text-yellow-800">⭐</span> : <span className="text-[10px] text-gray-400">🌐</span>}
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Override</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{state.isOverride ? "Customized" : "Global"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Enabled</span>
                      <button onClick={() => handleRoleToggle(page, "enabled")} className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${state.enabled ? "bg-green-100 border-green-300 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>{state.enabled ? "✅ Enabled" : "❌ Disabled"}</button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Coming Soon</span>
                      <button onClick={() => handleRoleToggle(page, "comingSoon")} className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tight border transition-all cursor-pointer ${state.comingSoon ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-gray-100 border-gray-200 text-gray-500"}`}>{state.comingSoon ? "🛡️ Coming Soon" : "🚀 Active"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400 font-bold uppercase tracking-wide">
            Select a role from the dropdown above to view or customize their configuration
          </div>
        )}
      </div>
    </div>
  );
}
