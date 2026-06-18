// ─────────────────────────────────────────────
// FILE: src/pages/admin/AdminMessages.tsx
// PURPOSE: Admin pane to send, edit, schedule, pin, and delete broadcast messages.
// ─────────────────────────────────────────────

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { writeJSON } from "../../utils/github";
import { ensureHttps } from "../../utils/linkUtils";
import { localToUtc, utcToDisplay, TZ_CAIRO, TZ_PRAGUE } from "../../utils/timezone";
import { compressImage } from "../../utils/image";

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

export default function AdminMessages() {
  const { messages, updateMessages } = useApp() as any;
  const navigate = useNavigate();
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Loading, saving, and toast alerts states
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "general",
    priority: "normal",
    recipients: "all",
    scheduledAt: "",
    expiresAt: "",
    pinned: false,
    buttons: [] as any[],
    imageUrl: "",
    inputTimezone: "Africa/Cairo",
    inputTimezoneExpires: "Africa/Cairo",
    timezoneDisplay: "both" as "both" | "prague" | "cairo",
    timezoneDisplayExpires: "both" as "both" | "prague" | "cairo"
  });

  if (!messages)
    return (
      <div className="p-8 text-center text-gray-500 font-bold">
        Loading Messages...
      </div>
    );

  /**
   * Triggers a temporary floating status toast feedback
   */
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleEdit = (msg: any) => {
    setEditingMsg(msg);
    setPublishMode(
      msg.status === "scheduled" ||
        (msg.scheduledAt && msg.scheduledAt > new Date().toISOString())
        ? "schedule"
        : "now",
    );
    setForm({
      title: msg.title || "",
      body: msg.body || "",
      category: msg.category || "general",
      priority: msg.priority || "normal",
      recipients: msg.recipients || msg.audience || "all",
      scheduledAt: msg.scheduledAt ? getCairoDatetimeLocal(msg.scheduledAt) : "",
      expiresAt: msg.expiresAt ? getCairoDatetimeLocal(msg.expiresAt) : "",
      pinned: msg.pinned || false,
      buttons: msg.buttons ? JSON.parse(JSON.stringify(msg.buttons)) : [],
      imageUrl: msg.imageUrl || "",
      inputTimezone: msg.inputTimezone || "Africa/Cairo",
      inputTimezoneExpires: msg.inputTimezoneExpires || "Africa/Cairo",
      timezoneDisplay: msg.timezoneDisplay || "both",
      timezoneDisplayExpires: msg.timezoneDisplayExpires || "both"
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
      recipients: "all",
      scheduledAt: "",
      expiresAt: "",
      pinned: false,
      buttons: [],
      imageUrl: "",
      inputTimezone: "Africa/Cairo",
      inputTimezoneExpires: "Africa/Cairo",
      timezoneDisplay: "both",
      timezoneDisplayExpires: "both"
    });
  };

  const handleDelete = async (id: string) => {
    setMessageToDelete(id);
  };

  /**
   * Robust delete message flow with GitHub persistence and rollback on failure.
   */
  const confirmDelete = async () => {
    if (!messageToDelete) return;
    setIsSaving(true);
    const oldMessages = [...messages]; // Capture state snapshot for rollback

    const updated = messages.filter((m: any) => m.id !== messageToDelete);

    try {
      // Optimistic UI update
      updateMessages(updated);
      setMessageToDelete(null);

      // Save changes to GitHub
      await writeJSON("messages.json", updated);
      showToast("Message deleted successfully!", "success");
    } catch (err: any) {
      console.error("Failed to delete message from GitHub:", err);
      // Rollback to historic state if save fails
      updateMessages(oldMessages);
      showToast(
        "Failed to delete message. Please check connection and try again.",
        "error",
      );
    } finally {
      setIsSaving(false);
      setMessageToDelete(null);
    }
  };

  const cancelDelete = () => {
    setMessageToDelete(null);
  };

  /**
   * Save message changes with optimistic state and GitHub backup.
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const now = new Date().toISOString();
    let status = "draft";
    let publishedAt = editingMsg?.publishedAt || null;
    let scheduledAt = form.scheduledAt
      ? localToUtc(form.scheduledAt, form.inputTimezone || "Africa/Cairo")
      : null;

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

    let expiresAt = null;
    if (form.expiresAt) {
      const eDate = localToUtc(form.expiresAt, form.inputTimezoneExpires || "Africa/Cairo");
      expiresAt = eDate;
      if (eDate <= now && status === "published") {
        status = "expired";
      }
    }

    const normalizedButtons = form.buttons.map((b) => ({
      ...b,
      link: ensureHttps(b.link),
    }));

    const payload = {
      id:
        editingMsg?.id === "new"
          ? crypto.randomUUID?.() || `msg_${Date.now()}`
          : editingMsg.id,
      title: form.title,
      body: form.body,
      category: form.category,
      status,
      scheduledAt,
      publishedAt,
      expiresAt,
      priority: form.priority,
      recipients: form.recipients,
      buttons: normalizedButtons,
      createdBy: "admin",
      readBy: editingMsg?.readBy || [],
      pinned: form.pinned,
      imageUrl: form.imageUrl || "",
      inputTimezone: form.inputTimezone || "Africa/Cairo",
      inputTimezoneExpires: form.inputTimezoneExpires || "Africa/Cairo",
      timezoneDisplay: form.timezoneDisplay || "both",
      timezoneDisplayExpires: form.timezoneDisplayExpires || "both"
    };

    const oldMessages = [...messages]; // Capture state snapshot for rollback
    let updated = [...messages];
    if (editingMsg?.id === "new") {
      updated = [payload, ...updated];
    } else {
      const idx = updated.findIndex((m: any) => m.id === payload.id);
      if (idx !== -1) updated[idx] = payload;
    }

    try {
      // Optimistic state change
      updateMessages(updated);

      // Persist to GitHub
      await writeJSON("messages.json", updated);

      showToast("Message sent and persisted successfully!", "success");
      setEditingMsg(null);
    } catch (err: any) {
      console.error("Failed to save message to GitHub:", err);
      // Rollback optimistic state changes
      updateMessages(oldMessages);
      showToast("Failed to save message. Keeping compose draft open.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 min-h-[44px] min-w-[44px] pr-2"
        >
          ← Admin Panel
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-sm font-semibold text-gray-700 truncate">
          Messages
        </h1>
      </div>
      {/* Toast Notification HUD */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-2 animate-bounce ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
          Message Center
        </h2>
        {!editingMsg && (
          <button
            onClick={initNew}
            disabled={isSaving}
            className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 rounded-lg px-4 py-2 font-bold text-sm transition-colors cursor-pointer"
          >
            + New Message
          </button>
        )}
      </div>

      {editingMsg ? (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                Title *
              </label>
              <input
                required
                value={form.title}
                disabled={isSaving}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                Body *
              </label>
              <textarea
                required
                rows={4}
                value={form.body}
                disabled={isSaving}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                Image / Photo (Optional)
              </label>
              <div className="flex flex-col gap-2">
                {form.imageUrl ? (
                  <div className="relative w-full max-w-md rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={form.imageUrl}
                      alt="Uploaded preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: "" })}
                      className="absolute top-2 right-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold text-xs"
                    >
                      ✕ Remove Photo
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer max-w-md">
                    <span className="text-3xl mb-1">📸</span>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tighter">
                      Click to Upload or Drag Photo
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">Accepts images & compresses optimized formats</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const res = await compressImage(file);
                            setForm((prev) => ({ ...prev, imageUrl: res }));
                          } catch (err) {
                            showToast("Failed to process image", "error");
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  disabled={isSaving}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="general">General</option>
                  <option value="notification">Notification</option>
                  <option value="schedule">Schedule</option>
                  <option value="logistics">Logistics</option>
                  <option value="urgent">Urgent</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                  Priority
                </label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-1 text-sm font-medium">
                    <input
                      type="radio"
                      value="normal"
                      disabled={isSaving}
                      checked={form.priority === "normal"}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                    />{" "}
                    Normal
                  </label>
                  <label className="flex items-center gap-1 text-sm font-medium">
                    <input
                      type="radio"
                      value="high"
                      disabled={isSaving}
                      checked={form.priority === "high"}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                    />{" "}
                    High
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                  Pinned
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    disabled={isSaving}
                    onChange={(e) =>
                      setForm({ ...form, pinned: e.target.checked })
                    }
                    className="rounded text-black focus:ring-black rounded-sm"
                  />
                  Stick to top of priority group
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                  Recipients
                </label>
                <select
                  value={form.recipients}
                  disabled={isSaving}
                  onChange={(e) =>
                    setForm({ ...form, recipients: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="all">All Users</option>
                  <option value="doctors">Doctors</option>
                  <option value="staff">Staff</option>
                  <option value="admins">Admins</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                  Publishing
                </label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-1 text-sm font-medium">
                    <input
                      type="radio"
                      value="now"
                      disabled={isSaving}
                      checked={publishMode === "now"}
                      onChange={() => setPublishMode("now")}
                    />{" "}
                    Publish Now
                  </label>
                  <label className="flex items-center gap-1 text-sm font-medium">
                    <input
                      type="radio"
                      value="schedule"
                      disabled={isSaving}
                      checked={publishMode === "schedule"}
                      onChange={() => setPublishMode("schedule")}
                    />{" "}
                    Schedule
                  </label>
                </div>
              </div>
              {publishMode === "schedule" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                    Scheduled At *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    disabled={isSaving}
                    value={form.scheduledAt}
                    onChange={(e) =>
                      setForm({ ...form, scheduledAt: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium"
                  />
                  
                  {!!form.scheduledAt && (() => {
                    const [dateInput, timeInput] = form.scheduledAt.split("T");
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
                      <div className="space-y-2 mt-1">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Timezone of this time
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="msgScheduledTimezone"
                                value="Africa/Cairo"
                                checked={(form.inputTimezone || "Africa/Cairo") === "Africa/Cairo"}
                                onChange={() => setForm({ ...form, inputTimezone: "Africa/Cairo" })}
                                className="accent-yellow-500 w-4 h-4"
                              />
                              <span className="text-xs font-medium text-gray-700">🇪🇬 Cairo</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="msgScheduledTimezone"
                                value="Europe/Prague"
                                checked={(form.inputTimezone || "Africa/Cairo") === "Europe/Prague"}
                                onChange={() => setForm({ ...form, inputTimezone: "Europe/Prague" })}
                                className="accent-yellow-500 w-4 h-4"
                              />
                              <span className="text-xs font-medium text-gray-700">🇨🇿 Prague</span>
                            </label>
                          </div>
                        </div>

                        {/* Timezone Display Mode Selector */}
                        <div className="flex flex-col gap-1 mt-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Show time to users as
                          </label>
                          <div className="flex flex-col gap-1 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="msgScheduledTzDisp"
                                value="both"
                                checked={(form.timezoneDisplay || "both") === "both"}
                                onChange={() => setForm({ ...form, timezoneDisplay: "both" })}
                                className="accent-yellow-500 w-4 h-4"
                              />
                              <span className="text-xs font-semibold text-gray-750">🇨🇿 Prague + 🇪🇬 Cairo</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="msgScheduledTzDisp"
                                value="prague"
                                checked={(form.timezoneDisplay || "both") === "prague"}
                                onChange={() => setForm({ ...form, timezoneDisplay: "prague" })}
                                className="accent-yellow-500 w-4 h-4"
                              />
                              <span className="text-xs font-semibold text-gray-750">🇨🇿 Prague only</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="msgScheduledTzDisp"
                                value="cairo"
                                checked={(form.timezoneDisplay || "both") === "cairo"}
                                onChange={() => setForm({ ...form, timezoneDisplay: "cairo" })}
                                className="accent-yellow-500 w-4 h-4"
                              />
                              <span className="text-xs font-semibold text-gray-750">🇪🇬 Cairo only</span>
                            </label>
                          </div>
                        </div>

                        {pragueDisplay && cairoDisplay && (
                          <div className="flex items-center gap-3 mt-1 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 font-medium">
                            <span>🇨🇿 Prague: <strong>{pragueDisplay}</strong></span>
                            <span className="text-gray-300">|</span>
                            <span>🇪🇬 Cairo: <strong>{cairoDisplay}</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className={publishMode === "now" ? "md:col-start-3" : ""}>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                  Expires At
                </label>
                <input
                  type="datetime-local"
                  disabled={isSaving}
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm({ ...form, expiresAt: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium"
                />

                {!!form.expiresAt && (() => {
                  const [dateInput, timeInput] = form.expiresAt.split("T");
                  const pragueDisplay = (() => {
                    if (!dateInput || !timeInput) return null;
                    try {
                      const utc = localToUtc(`${dateInput}T${timeInput}`, form.inputTimezoneExpires || "Africa/Cairo");
                      return utcToDisplay(utc, TZ_PRAGUE).time;
                    } catch { return null; }
                  })();
                  const cairoDisplay = (() => {
                    if (!dateInput || !timeInput) return null;
                    try {
                      const utc = localToUtc(`${dateInput}T${timeInput}`, form.inputTimezoneExpires || "Africa/Cairo");
                      return utcToDisplay(utc, TZ_CAIRO).time;
                    } catch { return null; }
                  })();

                  return (
                    <div className="space-y-2 mt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Timezone of this time
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="msgExpiresTimezone"
                              value="Africa/Cairo"
                              checked={(form.inputTimezoneExpires || "Africa/Cairo") === "Africa/Cairo"}
                              onChange={() => setForm({ ...form, inputTimezoneExpires: "Africa/Cairo" })}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="msgExpiresTimezone"
                              value="Europe/Prague"
                              checked={(form.inputTimezoneExpires || "Africa/Cairo") === "Europe/Prague"}
                              onChange={() => setForm({ ...form, inputTimezoneExpires: "Europe/Prague" })}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-gray-700">🇨🇿 Prague</span>
                          </label>
                        </div>
                      </div>

                      {/* Timezone Display Mode Selector */}
                      <div className="flex flex-col gap-1 mt-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Show time to users as
                        </label>
                        <div className="flex flex-col gap-1 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="msgExpiresTzDisp"
                              value="both"
                              checked={(form.timezoneDisplayExpires || "both") === "both"}
                              onChange={() => setForm({ ...form, timezoneDisplayExpires: "both" })}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-xs font-semibold text-gray-750">🇨🇿 Prague + 🇪🇬 Cairo</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="msgExpiresTzDisp"
                              value="prague"
                              checked={(form.timezoneDisplayExpires || "both") === "prague"}
                              onChange={() => setForm({ ...form, timezoneDisplayExpires: "prague" })}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-xs font-semibold text-gray-750">🇨🇿 Prague only</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="msgExpiresTzDisp"
                              value="cairo"
                              checked={(form.timezoneDisplayExpires || "both") === "cairo"}
                              onChange={() => setForm({ ...form, timezoneDisplayExpires: "cairo" })}
                              className="accent-yellow-500 w-4 h-4"
                            />
                            <span className="text-xs font-semibold text-gray-750">🇪🇬 Cairo only</span>
                          </label>
                        </div>
                      </div>

                      {pragueDisplay && cairoDisplay && (
                        <div className="flex items-center gap-3 mt-1 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 font-medium">
                          <span>🇨🇿 Prague: <strong>{pragueDisplay}</strong></span>
                          <span className="text-gray-300">|</span>
                          <span>🇪🇬 Cairo: <strong>{cairoDisplay}</strong></span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">
                  Buttons Builders
                </label>
                {form.buttons.length < 3 && !isSaving && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        buttons: [
                          ...form.buttons,
                          { label: "", link: "", style: "primary" },
                        ],
                      })
                    }
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded font-bold"
                  >
                    + Add Button
                  </button>
                )}
              </div>
              {form.buttons.map((btn, i) => (
                <div
                  key={i}
                  className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      placeholder="Label"
                      value={btn.label}
                      disabled={isSaving}
                      onChange={(e) => {
                        const b = [...form.buttons];
                        b[i].label = e.target.value;
                        setForm({ ...form, buttons: b });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                    />
                    <input
                      placeholder="Link (/route or https://...)"
                      value={btn.link}
                      disabled={isSaving}
                      onChange={(e) => {
                        const b = [...form.buttons];
                        b[i].link = e.target.value;
                        setForm({ ...form, buttons: b });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                    />
                    <select
                      value={btn.style}
                      disabled={isSaving}
                      onChange={(e) => {
                        const b = [...form.buttons];
                        b[i].style = e.target.value as any;
                        setForm({ ...form, buttons: b });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="ghost">Ghost</option>
                    </select>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        const b = [...form.buttons];
                        b.splice(i, 1);
                        setForm({ ...form, buttons: b });
                      }}
                      className="text-red-500 text-xs font-bold hover:text-red-700 transition-colors disabled:text-gray-405 duration-200"
                    >
                      Remove Button
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setEditingMsg(null)}
                className="px-4 py-2 font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 font-bold text-sm bg-black hover:bg-gray-800 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Message</span>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {messages.map((m: any) => {
            let badgeCls = "bg-gray-100 text-gray-600";
            if (m.status === "scheduled")
              badgeCls = "bg-blue-100 text-blue-700";
            if (m.status === "published")
              badgeCls = "bg-green-100 text-green-700";
            if (m.status === "expired") badgeCls = "bg-red-100 text-red-600";
            if (m.status === "archived") badgeCls = "bg-gray-200 text-gray-500";

            return (
              <div
                key={m.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 leading-tight flex-1 break-words">
                      {m.title}
                    </h3>
                    {m.pinned && <span className="text-sm">📌</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    <span className={`px-2 py-1 rounded ${badgeCls}`}>
                      {m.status}
                    </span>
                    <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded">
                      {m.priority}
                    </span>
                    {m.category && (
                      <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded">
                        {m.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{m.body}</p>
                  {m.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 max-h-32 bg-gray-50">
                      <img src={m.imageUrl} alt="Uploaded attachment preview" className="w-full h-24 object-cover" />
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-50 pt-3 mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex flex-col gap-1">
                    <span>
                      Recipients:{" "}
                      <strong className="capitalize text-gray-700">
                        {m.recipients || m.audience || "all"}
                      </strong>
                    </span>
                    {m.scheduledAt && (
                      <span>
                        Sched:{" "}
                        <strong className="text-gray-700">
                          {new Date(m.scheduledAt).toLocaleString()}
                        </strong>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(m)}
                      disabled={isSaving}
                      className="text-gray-400 hover:text-black transition-colors bg-transparent border-none cursor-pointer"
                      title="Edit"
                    >
                      <svg
                        className="w-5 h-5 inline"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={isSaving}
                      className="text-gray-400 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5 inline"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-400 font-bold italic">
              No messages found.
            </div>
          )}
        </div>
      )}

      {messageToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Delete Message
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this message? This action cannot
              be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors border-none cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
