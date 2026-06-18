import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useApp, matchesRole } from "../context/AppContext";
import { getPageAccess } from "../lib/pageAccess";
import ComingSoon from "../components/ComingSoon";
import { 
  Bell, 
  Calendar, 
  AlertTriangle, 
  Award, 
  ExternalLink, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  Volume2, 
  Info, 
  Tag, 
  ChevronRight, 
  Inbox, 
  Layers,
  Pin,
  Mail,
  MailOpen,
  Eye,
  EyeOff,
  Users,
  Compass,
  Sparkles,
  Bookmark,
  Maximize2,
  X
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";

export default function Activity() {
  const { messages, currentUser, content, updateMessages } = useApp() as any;
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const centralAccess = content?.settings 
    ? getPageAccess(currentUser?.id || "", currentUser?.role || "", "announcements", content.settings)
    : { enabled: true, comingSoon: false };

  // Helper nested access checks
  const isMessageVisible = (m: any) => {
    if (!currentUser) return false;
    const audienceObj = m.audience || m.recipients || m.targetRole || "all";
    return matchesRole(audienceObj, currentUser.role);
  };

  // Mark visible messages as read automatically
  useEffect(() => {
    if (!currentUser || !messages || messages.length === 0) return;

    // Filter unread messages that belong to the messages list (excluding notifications)
    const unreadVisible = messages.filter((m: any) => {
      const isPublished = m.status === "published" && (!m.expiresAt || new Date(m.expiresAt).getTime() > Date.now());
      const isRead = m.readBy && m.readBy.includes(currentUser.id);
      const belongs = m.category !== 'notification';

      return isPublished && isMessageVisible(m) && belongs && !isRead;
    });

    if (unreadVisible.length > 0) {
      // 1. Update localStorage cache index
      const readByLocal = JSON.parse(localStorage.getItem("euc_read_message_ids") || "[]");
      const unreadIds = unreadVisible.map((m: any) => m.id);
      const updatedReadLocal = Array.from(new Set([...readByLocal, ...unreadIds]));
      localStorage.setItem("euc_read_message_ids", JSON.stringify(updatedReadLocal));

      // 2. Map messages to set readBy property
      const updatedMessages = messages.map((m: any) => {
        if (unreadIds.includes(m.id)) {
          const reads = new Set(m.readBy || []);
          reads.add(currentUser.id);
          return { ...m, readBy: Array.from(reads) };
        }
        return m;
      });

      // 3. Update global messages state
      updateMessages(updatedMessages);

      // 4. Synergize with server-side read API if running
      fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, all: true })
      }).catch(err => {
        console.warn("Could not sync read-status to server:", err);
      });
    }
  }, [messages, currentUser, updateMessages]);

  if (!centralAccess.enabled) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-semibold text-gray-500">Not Found</h1>
        </div>
      </Layout>
    );
  }

  if (centralAccess.comingSoon) {
    return (
      <Layout>
        <ComingSoon />
      </Layout>
    );
  }

  // Toggle single message read/unread state manually
  const toggleReadStatus = (msgId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentUser || !messages) return;

    const updatedMessages = messages.map((m: any) => {
      if (m.id === msgId) {
        const reads = new Set(m.readBy || []);
        if (reads.has(currentUser.id)) {
          reads.delete(currentUser.id);
        } else {
          reads.add(currentUser.id);
        }
        return { ...m, readBy: Array.from(reads) };
      }
      return m;
    });

    // Update global state
    updateMessages(updatedMessages);

    // Sync localStorage
    const readIds = updatedMessages
      .filter((m: any) => m.readBy && m.readBy.includes(currentUser.id))
      .map((m: any) => m.id);
    localStorage.setItem("euc_read_message_ids", JSON.stringify(readIds));

    // Synergize server-side on mark read
    const isNowRead = updatedMessages.find((m: any) => m.id === msgId)?.readBy?.includes(currentUser.id);
    if (isNowRead) {
      fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, id: msgId })
      }).catch(err => {
        console.warn("Could not sync read-status to server:", err);
      });
    }
  };

  // Filter raw array items based on selected tab & visibility
  const getItems = () => {
    return messages.filter((m: any) => m.category !== 'notification' && isMessageVisible(m) && (filterCategory === "all" || m.category === filterCategory));
  };

  // Sort and apply custom prioritization
  const getSortedItems = () => {
    const rawItems = getItems();

    // Sort AppMessages logically representing full features of message center:
    // 1. Pinned status first
    // 2. Priority status second (urgent/high)
    // 3. Chronological desc third (newest first)
    return [...rawItems].sort((a: any, b: any) => {
      // 1. Pinned (true first)
      const aPinned = !!a.pinned;
      const bPinned = !!b.pinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // 2. High Priority (high/urgent first)
      const aHigh = a.priority === "high" || a.priority === "urgent";
      const bHigh = b.priority === "high" || b.priority === "urgent";
      if (aHigh && !bHigh) return -1;
      if (!aHigh && bHigh) return 1;

      // 3. Newest publication / creation first
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bTime - aTime;
    });
  };

  const handleMarkAllRead = () => {
    if (!currentUser || !messages || messages.length === 0) return;

    const unreadVis = messages.filter((m: any) => {
      const isPublished = m.status === "published" && (!m.expiresAt || new Date(m.expiresAt).getTime() > Date.now());
      const isRead = m.readBy && m.readBy.includes(currentUser.id);
      const belongs = m.category !== 'notification';

      return isPublished && isMessageVisible(m) && belongs && !isRead;
    });

    if (unreadVis.length > 0) {
      const readByLocal = JSON.parse(localStorage.getItem("euc_read_message_ids") || "[]");
      const unreadIds = unreadVis.map((m: any) => m.id);
      const updatedReadLocal = Array.from(new Set([...readByLocal, ...unreadIds]));
      localStorage.setItem("euc_read_message_ids", JSON.stringify(updatedReadLocal));

      const updatedMessages = messages.map((m: any) => {
        if (unreadIds.includes(m.id)) {
          const reads = new Set(m.readBy || []);
          reads.add(currentUser.id);
          return { ...m, readBy: Array.from(reads) };
        }
        return m;
      });

      updateMessages(updatedMessages);

      fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, all: true })
      }).catch(err => {
        console.warn("Could not sync read-status to server:", err);
      });
    }
  };

  const sortedAndFilteredItems = getSortedItems();
  
  // Calculate unread items count in message center
  const getUnreadCount = () => {
    if (!currentUser || !messages) return 0;
    return messages.filter((m: any) => {
      const isPublished = m.status === "published" && (!m.expiresAt || new Date(m.expiresAt).getTime() > Date.now());
      const isRead = m.readBy && m.readBy.includes(currentUser.id);
      const belongs = m.category !== 'notification';
      return isPublished && isMessageVisible(m) && belongs && !isRead;
    }).length;
  };

  const hasUnread = getUnreadCount() > 0;

  const categories = ["all", ...new Set(messages.filter((m: any) => isMessageVisible(m) && m.category !== 'notification').map((m: any) => m.category || "General"))];

  const getCategoryStyles = (category: string) => {
    switch (category?.toLowerCase()) {
      case "urgent":
      case "alert":
        return { bg: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle };
      case "announcement":
      case "broadcast":
        return { bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Volume2 };
      case "schedule":
      case "milestone":
        return { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: Calendar };
      case "logistics":
      case "flight":
      case "hotel":
      case "travel":
        return { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Compass };
      case "social":
      case "networking":
        return { bg: "bg-pink-50 text-pink-700 border-pink-200", icon: Sparkles };
      case "sessions":
      case "session":
        return { bg: "bg-purple-50 text-purple-700 border-purple-200", icon: Award };
      case "notification":
        return { bg: "bg-sky-50 text-sky-700 border-sky-200", icon: Bell };
      default:
        return { bg: "bg-gray-100 text-gray-700 border-gray-200", icon: Info };
    }
  };

  const getRecipientsBadge = (recipients: string) => {
    switch (recipients?.toLowerCase()) {
      case "all":
        return { bg: "bg-gray-100 text-gray-600", text: "All Attendees" };
      case "doctors":
        return { bg: "bg-blue-50 text-blue-800 border border-blue-100", text: "Doctors" };
      case "speakers":
      case "speaker":
        return { bg: "bg-purple-50 text-purple-800 border border-purple-100", text: "Speakers" };
      case "admin":
      case "admins":
        return { bg: "bg-yellow-50 text-yellow-800 border border-yellow-100", text: "Admins" };
      default:
        return { bg: "bg-gray-50 text-gray-700 border border-gray-100", text: recipients };
    }
  };

  return (
    <Layout>
      <div className="flex flex-col mb-6">
        {/* Categories, Action Buttons and Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-black text-gray-900 capitalize tracking-tight flex items-center gap-2">
            <span>Message Center</span>
          </h1>
          
          <div className="flex items-center gap-3">
            {hasUnread && (
              <button
                onClick={handleMarkAllRead}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-lg transition-colors duration-150"
              >
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                Mark all as read
              </button>
            )}

            {categories.length > 2 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:inline">Filter:</span>
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-blue-500"
                >
                  {categories.map(c => (
                    <option key={c} value={c} className="capitalize font-bold">
                      {c === "all" ? "All Categories" : c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {hasUnread && (
          <div className="sm:hidden mt-3">
            <button
              onClick={handleMarkAllRead}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-lg hover:bg-blue-100 transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        )}
      </div>
      
      {/* Messages/Notifications Items Display list */}
      <div className="space-y-4">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-gray-50 rounded-full text-gray-400">
              <Inbox className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">All clear!</p>
              <p className="text-sm text-gray-400">No messages available at this time.</p>
            </div>
          </div>
        ) : (
          sortedAndFilteredItems.map((item: any, idx: number) => {
            const isUnread = currentUser && (!item.readBy || !item.readBy.includes(currentUser.id));
            const isHighPriority = item.priority === "high" || item.priority === "urgent";
            const isPinned = !!item.pinned;
            const categoryLabel = item.category || "General";
            const audienceVal = item.recipients || item.audience || "all";
            
            const catStyle = getCategoryStyles(categoryLabel);
            const CatIcon = catStyle.icon;
            const audienceBadge = getRecipientsBadge(audienceVal);

            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.4) }}
                className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden bg-white ${
                  isUnread 
                    ? "border-blue-100 bg-blue-50/10 shadow-sm" 
                    : "border-gray-100 hover:border-gray-200 shadow-xs"
                } ${
                  isPinned
                    ? "ring-1 ring-amber-400 bg-amber-50/5"
                    : ""
                }`}
              >
                {/* Accent Indicators on left border */}
                <div className={`absolute top-0 left-0 bottom-0 w-[4px] ${
                  isPinned 
                    ? "bg-amber-500" 
                    : isHighPriority 
                    ? "bg-red-500" 
                    : isUnread 
                    ? "bg-blue-600" 
                    : "bg-gray-200"
                }`} />

                {/* Header Tag list */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pl-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {isPinned && (
                      <span className="inline-flex items-center gap-1 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight shadow-xs">
                        <Pin className="w-3 h-3 fill-white" />
                        Pinned
                      </span>
                    )}

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${catStyle.bg}`}>
                      <CatIcon className="w-3 h-3" />
                      {categoryLabel}
                    </span>
                    
                    {isHighPriority && (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        Urgent
                      </span>
                    )}

                    {audienceVal !== "all" && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${audienceBadge.bg}`}>
                        {audienceBadge.text}
                      </span>
                    )}
                  </div>

                  {/* Interactive Read/Unread Icon and Date indicator */}
                  <div className="flex items-center gap-2.5 ml-auto">
                    {/* Date Time field */}
                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {item.publishedAt || item.createdAt 
                          ? new Date(item.publishedAt || item.createdAt).toLocaleDateString([], { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : "System Alert"
                        }
                      </span>
                    </div>

                    {/* Interactive Read Status Action Badge */}
                    <button
                      onClick={(e) => toggleReadStatus(item.id, e)}
                      title={isUnread ? "Mark as Read" : "Mark as Unread"}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all duration-150 border cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                        isUnread 
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" 
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600"
                      }`}
                    >
                      {isUnread ? (
                        <>
                          <Mail className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                          <span className="uppercase tracking-wider hidden sm:inline">Unread</span>
                        </>
                      ) : (
                        <>
                          <MailOpen className="w-3.5 h-3.5" />
                          <span className="uppercase tracking-wider hidden sm:inline font-bold">Read</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Text Title & Body */}
                <div className="pl-1">
                  <h3 className="font-extrabold text-gray-900 text-lg tracking-tight mb-2 leading-snug flex items-center gap-1.5">
                    {item.title || item.name || "System Alert"}
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                    )}
                  </h3>

                  <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-3xl whitespace-pre-line mb-4">
                    {item.body || item.message || item.description || ""}
                  </p>

                  {item.imageUrl && (
                    <div className="mb-5 mt-1 max-w-xl">
                      <div 
                        onClick={() => setLightboxImage(item.imageUrl)}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-xs hover:shadow-md transition-all duration-300 transform active:scale-[0.99]"
                      >
                        <img
                          src={item.imageUrl}
                          alt="Message Attachment"
                          className="w-full max-h-80 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-xs px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black text-gray-900 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Click to Expand</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Link Group */}
                  {item.buttons && item.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-4 pt-3 border-t border-gray-50">
                      {item.buttons.map((btn: any, btnIdx: number) => {
                        const isExt = btn.link && (btn.link.startsWith("http") || btn.link.startsWith("//"));
                        const btnStyleClass = 
                          btn.style === "primary"
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-extrabold hover:shadow-md hover:scale-[1.02]"
                            : btn.style === "ghost"
                            ? "bg-transparent hover:bg-gray-100 text-gray-600 font-bold"
                            : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold hover:border-gray-300";

                        return isExt ? (
                          <a
                            key={btnIdx}
                            href={btn.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl transition-all duration-150 ${btnStyleClass}`}
                          >
                            <span>{btn.label || "More info"}</span>
                            <ExternalLink className="w-3 h-3 text-current shrink-0" />
                          </a>
                        ) : (
                          <Link
                            key={btnIdx}
                            to={btn.link || "/"}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl transition-all duration-150 ${btnStyleClass}`}
                          >
                            <span>{btn.label || "Navigate"}</span>
                            <ChevronRight className="w-3 h-3 text-current shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300 p-4"
        >
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={() => setLightboxImage(null)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-105 active:scale-95 duration-150"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-5xl rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 max-h-[85vh]"
          >
            <img 
              src={lightboxImage} 
              alt="Message Attachment High Resolution" 
              className="w-full h-auto max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
