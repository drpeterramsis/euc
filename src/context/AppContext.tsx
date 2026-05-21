// ─────────────────────────────────────────────────────────────────
// FILE: src/context/AppContext.tsx
// STRATEGY:
//
// ON FIRST LOAD (after login, empty sessionStorage):
//   → Show loading spinner
//   → Fetch all 4 JSON files from GitHub simultaneously
//   → Store in React state + sessionStorage + update localStorage timestamp
//   → Hide spinner — app is ready
//
// ON BROWSER REFRESH (sessionStorage has data):
//   → Read from sessionStorage INSTANTLY — no spinner
//   → App is immediately usable
//   → Check localStorage timestamp
//   → If data is older than REFRESH_INTERVAL → fetch fresh data silently in background
//   → When background fetch completes → update state + sessionStorage silently
//   → User never sees a loading state
//
// ON LOGOUT:
//   → Clear sessionStorage (all 4 keys)
//   → Clear localStorage timestamp
//   → Clear React state
//   → Redirect to login
//
// ON ADMIN WRITE (create/edit/delete):
//   → After writeJSON completes:
//   → Update React state immediately (optimistic UI)
//   → Update sessionStorage immediately
//   → Update localStorage timestamp
//   → No re-fetch needed
// ─────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { readJSON } from "../utils/github";

export const CACHE = {
  users:     "euc_session_users",
  schedule:  "euc_session_schedule",
  sessions:  "euc_session_sessions",
  settings:  "euc_session_settings",
  media:     "euc_session_media",
  tripInfo:  "euc_session_tripInfo",
  appConfig: "euc_session_appConfig",
  messages:  "euc_session_messages",
  galleries: "euc_session_galleries",
  lastFetch: "euc_last_fetch_time",
};

export const DEFAULT_SCHEDULE_CATEGORIES = ["Scientific", "Social", "Transport", "Other"];
export const DEFAULT_MEDIA_CATEGORIES = ["Conference", "Social", "Tours", "Awards"];

export interface TripInfo {
  hotel: {
    name: string;
    mapUrl: string;
  };
  departure: {
    flightNumber: string;
    date: string;
    terminal: string;
  };
  arrival: {
    flightNumber: string;
    date: string;
    terminal: string;
  };
}

export const DEFAULT_TRIP_INFO: TripInfo = {
  hotel: {
    name: "Vienna House Diplomat Prague",
    mapUrl: "https://maps.app.goo.gl/PuScYyJrgmk4SMq58"
  },
  departure: {
    flightNumber: "MS.789",
    date: "25 June 2026",
    terminal: "3"
  },
  arrival: {
    flightNumber: "MS.790",
    date: "28 June 2026",
    terminal: "1"
  }
};

export interface MessageButton {
  label: string;
  link: string;
  style: "primary" | "secondary" | "ghost";
}

export interface AppMessage {
  id: string;
  title: string;
  body: string;
  status: "draft" | "scheduled" | "published" | "expired" | "archived";
  category: "general" | "schedule" | "logistics" | "urgent" | "social" | "other";
  scheduledAt: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  priority: "normal" | "high";
  recipients: "all" | string;
  buttons: MessageButton[];
  createdBy: string;
  readBy: string[];
  pinned: boolean;
}

export interface GalleryImage {
  url: string;
  caption: string;
}

export interface GalleryAlbum {
  id: string;
  type: "gallery";
  title: string;
  category:
    | "trip-gallery"
    | "conference"
    | "social"
    | "landmarks"
    | "user-uploads";
  publishedAt: string;
  scheduledAt: string | null;
  images: GalleryImage[];
  showInFeed: boolean;
  showInLatest: boolean;
  uploadedBy: string;
  allowDownload?: boolean;
}

export interface PageConfig {
  visible: boolean;
  comingSoon: boolean;
}

export interface AppConfig {
  navLabels: Record<string, string>;
  navOrder?: string[];
  pages?: Record<string, PageConfig>;
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  navLabels: {
    dashboard: "Home Page",
    schedule: "Schedule",
    sessions: "Sessions",
    media: "News Feed",
    directory: "Staff Directory",
    profile: "My Profile"
  },
  navOrder: [
    "dashboard",
    "schedule",
    "sessions",
    "media",
    "directory",
    "profile"
  ],
  pages: {
    directory: { visible: true,  comingSoon: false },
    media:     { visible: true,  comingSoon: false },
  }
};

/**
 * Normalizes recipients and user roles, removing plurals to ensure precise routing matching.
 */
export function matchesRole(recipients: any, userRole: string): boolean {
  if (!recipients) return true;
  const list = Array.isArray(recipients) ? recipients : [recipients];
  const normalize = (s: string) => s.toLowerCase().replace(/s$/, "").trim();
  const role = normalize(userRole || "");
  return list.some(r => {
    const n = normalize(r);
    return n === "all" || n === "all_user" || n === "all_users" || n === role;
  });
}

interface AppContextType {
  users:       any[];
  schedule:    any[];
  sessions:    any[];
  settings:    any;
  media:       any[];
  tripInfo:    TripInfo;
  appConfig:   AppConfig;
  messages:    AppMessage[];
  galleries:   GalleryAlbum[];
  currentUser: any;
  loading:     boolean;
  isFirstLoad: boolean;
  error:       string | null;
  isBackgroundRefreshing: boolean;
  updateUsers:    (data: any[])  => void;
  updateSchedule: (data: any[])  => void;
  updateSessions: (data: any[])  => void;
  updateSettings: (data: any)    => void;
  updateMedia:    (data: any[])  => void;
  updateTripInfo: (data: TripInfo) => void;
  updateAppConfig: (data: AppConfig) => void;
  updateMessages: (data: AppMessage[]) => void;
  updateGalleries: (data: GalleryAlbum[]) => void;
  refreshData:    () => Promise<void>;
  loginUser:      (user: any) => void;
  installPrompt:  any | null;
  isAppInstalled: boolean;
  triggerInstall: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function readSessionCache() {
  try {
    const u  = sessionStorage.getItem(CACHE.users);
    const sc = sessionStorage.getItem(CACHE.schedule);
    const se = sessionStorage.getItem(CACHE.sessions);
    const st = sessionStorage.getItem(CACHE.settings);
    const md = sessionStorage.getItem(CACHE.media);
    const ti = sessionStorage.getItem(CACHE.tripInfo);
    const ac = sessionStorage.getItem(CACHE.appConfig);
    const ms = sessionStorage.getItem(CACHE.messages);
    const ga = sessionStorage.getItem(CACHE.galleries);
    
    // Fallback if tripInfo is missing from cache but everything else is there
    const parsedTripInfo = ti ? JSON.parse(ti) : null;
    const parsedAppConfig = ac ? JSON.parse(ac) : null;
    
    if (parsedTripInfo && (!parsedTripInfo?.hotel?.name || !parsedTripInfo?.departure?.flightNumber)) {
      sessionStorage.removeItem(CACHE.tripInfo);
    }
    
    if (u && sc && se && st && md) {
      return {
        users:    JSON.parse(u),
        schedule: JSON.parse(sc),
        sessions: JSON.parse(se),
        settings: JSON.parse(st),
        media:    JSON.parse(md),
        tripInfo: parsedTripInfo && parsedTripInfo?.hotel?.name ? parsedTripInfo : DEFAULT_TRIP_INFO,
        appConfig: parsedAppConfig || DEFAULT_APP_CONFIG,
        messages: ms ? JSON.parse(ms) : [],
        galleries: ga ? JSON.parse(ga) : [],
      };
    }
  } catch { }
  return null;
}

function writeSessionCache(data: { users: any[], schedule: any[], sessions: any[], settings: any, media: any[], tripInfo: TripInfo, appConfig: AppConfig, messages?: AppMessage[], galleries?: GalleryAlbum[] }) {
  try {
    sessionStorage.setItem(CACHE.users,    JSON.stringify(data.users));
    sessionStorage.setItem(CACHE.schedule, JSON.stringify(data.schedule));
    sessionStorage.setItem(CACHE.sessions, JSON.stringify(data.sessions));
    sessionStorage.setItem(CACHE.settings, JSON.stringify(data.settings));
    sessionStorage.setItem(CACHE.media,    JSON.stringify(data.media));
    sessionStorage.setItem(CACHE.tripInfo, JSON.stringify(data.tripInfo));
    sessionStorage.setItem(CACHE.appConfig, JSON.stringify(data.appConfig));
    if (data.messages) sessionStorage.setItem(CACHE.messages, JSON.stringify(data.messages));
    if (data.galleries) sessionStorage.setItem(CACHE.galleries, JSON.stringify(data.galleries));
    localStorage.setItem(CACHE.lastFetch,  Date.now().toString());
  } catch { }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users,    setUsers]    = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [media,    setMedia]    = useState<any[]>([]);
  const [tripInfo, setTripInfo] = useState<TripInfo>(DEFAULT_TRIP_INFO);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [galleries, setGalleries] = useState<GalleryAlbum[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    // Capture install prompt globally
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") setIsAppInstalled(true);
    setInstallPrompt(null);
  };

  const fetchedRef = useRef(false);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("euc_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const fetchFreshData = useCallback(async () => {
    const [u, sc, se, st, md, ti, ac, ms, ga] = await Promise.all([
      readJSON("users.json"),
      readJSON("schedule.json"),
      readJSON("sessions.json"),
      readJSON("settings.json").catch(() => ({})),
      readJSON("media.json").catch(() => []), 
      readJSON("tripInfo.json").catch(() => DEFAULT_TRIP_INFO),
      readJSON("appConfig.json").catch(() => DEFAULT_APP_CONFIG),
      (async () => {
        try {
          const fresh = await readJSON("messages.json");
          const readByLocal = JSON.parse(localStorage.getItem("euc_read_message_ids") || "[]");
          const uRaw = localStorage.getItem("euc_user");
          const cUser = uRaw ? JSON.parse(uRaw) : null;
          if (cUser) {
            return fresh.map((m: any) => {
              if (readByLocal.includes(m.id)) {
                const readSet = new Set(m.readBy || []);
                readSet.add(cUser.id);
                return { ...m, readBy: Array.from(readSet) };
              }
              return m;
            });
          }
          return fresh;
        } catch {
          return [];
        }
      })(),
      readJSON("gallery.json").catch(() => []),
    ]);

    // Merge settings with defaults
    const s = st as any;
    const mergedSettings = {
      ...s,
      scheduleCategories: [...new Set([...DEFAULT_SCHEDULE_CATEGORIES, ...(s.scheduleCategories || [])])],
      mediaCategories: [...new Set([...DEFAULT_MEDIA_CATEGORIES, ...(s.mediaCategories || [])])],
    };

    return { users: u, schedule: sc, sessions: se, settings: mergedSettings, media: md, tripInfo: ti, appConfig: ac, messages: ms, galleries: ga };
  }, []);

  const backgroundRefresh = useCallback(async () => {
    try {
      setIsBackgroundRefreshing(true);
      const fresh = await fetchFreshData();
      const cached = readSessionCache();

      const stableStringify = (obj: any) => JSON.stringify(obj);

      if (!cached) {
        setUsers(fresh.users);
        setSchedule(fresh.schedule);
        setSessions(fresh.sessions);
        setSettings(fresh.settings);
        setMedia(fresh.media);
        setTripInfo(fresh.tripInfo);
        setAppConfig(fresh.appConfig);
        setMessages(fresh.messages);
        setGalleries(fresh.galleries);
        writeSessionCache(fresh);
        return;
      }

      const changed = 
        stableStringify(fresh.users) !== stableStringify(cached.users) ||
        stableStringify(fresh.schedule) !== stableStringify(cached.schedule) ||
        stableStringify(fresh.sessions) !== stableStringify(cached.sessions) ||
        stableStringify(fresh.settings) !== stableStringify(cached.settings) ||
        stableStringify(fresh.media) !== stableStringify(cached.media) ||
        stableStringify(fresh.tripInfo) !== stableStringify(cached.tripInfo) ||
        stableStringify(fresh.appConfig) !== stableStringify(cached.appConfig) ||
        stableStringify(fresh.messages) !== stableStringify(cached.messages) ||
        stableStringify(fresh.galleries) !== stableStringify(cached.galleries);

      if (changed) {
        setUsers(fresh.users);
        setSchedule(fresh.schedule);
        setSessions(fresh.sessions);
        setSettings(fresh.settings);
        setMedia(fresh.media);
        setTripInfo(fresh.tripInfo);
        setAppConfig(fresh.appConfig);
        setMessages(fresh.messages);
        setGalleries(fresh.galleries);
        writeSessionCache(fresh);

        // Deeply update currentUser if their data changed
        if (currentUser) {
          const freshCurrentUser = fresh.users.find((u: any) => u.id === currentUser.id);
          if (freshCurrentUser && JSON.stringify(freshCurrentUser) !== JSON.stringify(currentUser)) {
            setCurrentUser(freshCurrentUser);
            localStorage.setItem("euc_user", JSON.stringify(freshCurrentUser));
            sessionStorage.setItem("euc_view_as", JSON.stringify(freshCurrentUser));
          }
        }
      }
    } catch {
      console.warn("Background refresh failed — using cached data");
    } finally {
      setIsBackgroundRefreshing(false);
    }
  }, [fetchFreshData, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cached = readSessionCache();

    if (cached) {
      setUsers(cached.users);
      setSchedule(cached.schedule);
      setSessions(cached.sessions);
      setSettings(cached.settings);
      setMedia(cached.media);
      setTripInfo(cached.tripInfo);
      setAppConfig(cached.appConfig);
      if (cached.messages) setMessages(cached.messages);
      if (cached.galleries) setGalleries(cached.galleries);
      setLoading(false);
      setIsFirstLoad(false);

      // Deeply update/propagate currentUser fields on browser refresh
      if (currentUser) {
        const matchedUser = cached.users.find((u: any) => u.username === currentUser.username);
        if (matchedUser) {
          const updatedUser = {
            ...currentUser,
            ...matchedUser,
            photoUrl: matchedUser.photoUrl || matchedUser.photo || currentUser.photoUrl || ""
          };
          setCurrentUser(updatedUser);
          localStorage.setItem("euc_user", JSON.stringify(updatedUser));
        }
      }

      // ALWAYS run a background refresh on mount when user is logged in after a short delay
      setTimeout(() => backgroundRefresh(), 2000);
    } else {
      setLoading(true);
      fetchFreshData()
        .then(fresh => {
          setUsers(fresh.users);
          setSchedule(fresh.schedule);
          setSessions(fresh.sessions);
          setSettings(fresh.settings);
          setMedia(fresh.media);
          setTripInfo(fresh.tripInfo);
          setAppConfig(fresh.appConfig);
          setMessages(fresh.messages);
          setGalleries(fresh.galleries);
          writeSessionCache(fresh);

          // Deeply update/propagate currentUser fields on initial fetch
          if (currentUser) {
            const matchedUser = fresh.users.find((u: any) => u.username === currentUser.username);
            if (matchedUser) {
              const updatedUser = {
                ...currentUser,
                ...matchedUser,
                photoUrl: matchedUser.photoUrl || matchedUser.photo || currentUser.photoUrl || ""
              };
              setCurrentUser(updatedUser);
              localStorage.setItem("euc_user", JSON.stringify(updatedUser));
            }
          }
        })
        .catch(() => {
          setError("Failed to load data. Please refresh.");
        })
        .finally(() => {
          setLoading(false);
          setIsFirstLoad(false);
        });
    }
  }, [currentUser, backgroundRefresh, fetchFreshData]);

  // Periodic silent background sync polling every 30 seconds to download live message and galleries updates
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      backgroundRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser, backgroundRefresh]);

  const loginUser = useCallback((user: any) => {
    const matchedUser = users.find(u => u.username === user.username) || user;
    const finalUser = {
      ...user,
      ...matchedUser,
      photoUrl: matchedUser.photoUrl || matchedUser.photo || user.photoUrl || ""
    };
    localStorage.setItem("euc_user", JSON.stringify(finalUser));
    setCurrentUser(finalUser);
    fetchedRef.current = false;
  }, [users]);

  const updateUsers = useCallback((data: any[]) => {
    setUsers(data);
    try { 
      sessionStorage.setItem(CACHE.users, JSON.stringify(data));
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const updateSchedule = useCallback((data: any[]) => {
    setSchedule(data);
    try { 
      sessionStorage.setItem(CACHE.schedule, JSON.stringify(data));
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const updateSessions = useCallback((data: any[]) => {
    setSessions(data);
    try { 
      sessionStorage.setItem(CACHE.sessions, JSON.stringify(data));
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const updateSettings = useCallback((data: any) => {
    setSettings(data);
    try { 
      sessionStorage.setItem(CACHE.settings, JSON.stringify(data));
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const updateMedia = useCallback((data: any[]) => {
    setMedia(data);
    try { 
      sessionStorage.setItem(CACHE.media, JSON.stringify(data));
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const updateTripInfo = useCallback((data: TripInfo) => {
    setTripInfo(data);
    try { 
      sessionStorage.setItem(CACHE.tripInfo, JSON.stringify(data));
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const updateAppConfig = useCallback((data: AppConfig) => {
    setAppConfig(data);
    try { 
      sessionStorage.setItem(CACHE.appConfig, JSON.stringify(data));
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const updateMessages = useCallback((data: AppMessage[]) => {
    setMessages(data);
    try {
      sessionStorage.setItem(CACHE.messages, JSON.stringify(data));
      localStorage.setItem("euc_messages", JSON.stringify(data));
      const uRaw = localStorage.getItem("euc_user");
      const cUser = uRaw ? JSON.parse(uRaw) : null;
      if (cUser) {
        const readIds = data
          .filter((m: any) => m.readBy && m.readBy.includes(cUser.id))
          .map((m: any) => m.id);
        localStorage.setItem("euc_read_message_ids", JSON.stringify(readIds));
      }
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const updateGalleries = useCallback((data: GalleryAlbum[]) => {
    setGalleries(data);
    try {
      sessionStorage.setItem(CACHE.galleries, JSON.stringify(data));
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await fetchFreshData();
      setUsers(fresh.users);
      setSchedule(fresh.schedule);
      setSessions(fresh.sessions);
      setSettings(fresh.settings);
      setMedia(fresh.media);
      setTripInfo(fresh.tripInfo);
      setAppConfig(fresh.appConfig);
      setMessages(fresh.messages);
      setGalleries(fresh.galleries);
      writeSessionCache(fresh);
    } catch {
      setError("Failed to refresh data.");
    } finally {
      setLoading(false);
    }
  }, [fetchFreshData]);

  // Message status checking interval
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prev => {
        let changed = false;
        const now = new Date().toISOString();
        const updated = prev.map(msg => {
          let m = { ...msg };
          
          if (m.status === "scheduled" && m.scheduledAt && m.scheduledAt <= now) {
            m.status = "published";
            if (!m.publishedAt) m.publishedAt = now;
            changed = true;
          }
          
          if (m.status === "published" && m.expiresAt && m.expiresAt <= now) {
            m.status = "expired";
            changed = true;
          }
          
          return m;
        });
        
        if (changed) {
          try {
            sessionStorage.setItem(CACHE.messages, JSON.stringify(updated));
            localStorage.setItem("euc_messages", JSON.stringify(updated));
            localStorage.setItem(CACHE.lastFetch, Date.now().toString());
          } catch {}
          return updated;
        }
        return prev;
      });
    }, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{
      users, schedule, sessions, settings, media, tripInfo, appConfig, messages, galleries,
      currentUser, loading, isFirstLoad, error, isBackgroundRefreshing,
      updateUsers, updateSchedule, updateSessions, updateSettings, updateMedia, updateTripInfo, updateAppConfig, updateMessages, updateGalleries,
      refreshData, loginUser, installPrompt, isAppInstalled, triggerInstall
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export const useAppContext = useApp;
