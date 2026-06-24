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
import { loadSession, clearSession } from "../utils/session";

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
    mapUrl: "https://maps.app.goo.gl/526iVtZV4oZUQ8Sh6"
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

export function getDefaultFlightDetails(name: string) {
  return {
    bookingReference: "XMVNK8",
    ticketNumber: `077-6908093857`,
    documentIssueDate: "11 June 2026",
    airlineCode: "MS (Egyptair)",
    frequentFlyerNumber: `MS4001012993`,
    bookingStatus: "Confirmed",
    cabinClass: "Economy",
    baggageAllowance: `2 Piece(s)`,
    aircraft: "AIRBUS A320NEO",
    meal: "Meal",
    duration: "03:55",
    departure: {
      flightNumber: "MS 789",
      date: "2026-06-25",
      time: "12:50",
      departureAirport: "Cairo, (Cairo Intl)",
      departureAirportLink: "https://maps.app.goo.gl/eqq3eSQEkkb9nEPz7",
      departureAirportPhotoUrl: "https://dl.dropboxusercontent.com/scl/fi/bck8538s5pp109ns47tk7/cairo_airport.webp?rlkey=ikmzh780qea8juim09o44bp9p&st=sov4t97n",
      arrivalAirport: "Prague, (Vaclav Havel)",
      arrivalAirportLink: "https://maps.app.goo.gl/hEMvxstxDQ3ySn447",
      arrivalAirportPhotoUrl: "https://dl.dropboxusercontent.com/scl/fi/kjjra5b0zs63ubfupye3a/prague_airport.jpg?rlkey=bd40zfck0pbbdh2te8jipk4xi&st=cy4e4qvc",
      terminal: "3",
      gate: "",
      inputTimezone: "Africa/Cairo",
      timezoneDisplay: "both",
      arrivalTime: "15:45",
      arrivalDate: "2026-06-25",
      arrivalTerminal: "1",
      arrivalGate: "",
      duration: "03:55 (Non stop)",
      aircraft: "AIRBUS A320NEO",
      baggage: `2 Piece(s)`,
      meal: "Meal",
      cabinClass: "Economy",
      bookingStatus: "Confirmed",
      frequentFlyerNumber: `MS4001012993`,
    },
    arrival: {
      flightNumber: "MS 790",
      date: "2026-07-05",
      time: "16:45",
      departureAirport: "Prague, (Vaclav Havel)",
      departureAirportLink: "https://maps.app.goo.gl/hEMvxstxDQ3ySn447",
      departureAirportPhotoUrl: "https://dl.dropboxusercontent.com/scl/fi/kjjra5b0zs63ubfupye3a/prague_airport.jpg?rlkey=bd40zfck0pbbdh2te8jipk4xi&st=cy4e4qvc",
      arrivalAirport: "Cairo, (Cairo Intl)",
      arrivalAirportLink: "https://maps.app.goo.gl/eqq3eSQEkkb9nEPz7",
      arrivalAirportPhotoUrl: "https://dl.dropboxusercontent.com/scl/fi/bck8538s5pp109ns47tk7/cairo_airport.webp?rlkey=ikmzh780qea8juim09o44bp9p&st=sov4t97n",
      terminal: "1",
      gate: "",
      inputTimezone: "Europe/Prague",
      timezoneDisplay: "both",
      arrivalTime: "21:35",
      arrivalDate: "2026-07-05",
      arrivalTerminal: "3",
      arrivalGate: "",
      duration: "03:50 (Non stop)",
      aircraft: "AIRBUS A320NEO",
      baggage: `2 Piece(s)`,
      meal: "Meal",
      cabinClass: "Economy",
      bookingStatus: "Confirmed",
      frequentFlyerNumber: `MS4001012993`,
    }
  };
}

export function getDefaultHotelDetails() {
  return {
    name: "Vienna House Diplomat Prague",
    address: "Evropská 15, 160 41 Praha 6, Czech Republic",
    checkIn: "2026-06-25",
    checkOut: "2026-07-05",
    roomNumber: "Allocated upon arrival",
    mapsLink: "https://maps.app.goo.gl/526iVtZV4oZUQ8Sh6",
    photoUrl: "https://dl.dropboxusercontent.com/scl/fi/lf60zdhhkwucu3zhmc074/Diplomat-Hotel-Prague.png?rlkey=iit6sq96u71ug40mb3603yyky&st=ojhoihcn"
  };
}


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
    media: "Gallery",
    directory: "Staff Directory",
    profile: "My Profile"
  },
  navOrder: [
    "dashboard",
    "profile",
    "schedule",
    "sessions",
    "media",
    "directory"
  ],
  pages: {
    directory: { visible: true,  comingSoon: false },
    media:     { visible: true,  comingSoon: false },
  }
};

export const DEFAULT_CONTENT = {
  home: { description: "Welcome to Experts of Urology Community Prague Conference Trip Management App" },
  announcements: [],
  agenda: [],
  posts: [],
  media: [],
  albums: [],
  settings: {
    pages: {
      announcements: { enabled: true, comingSoon: false },
      agenda:        { enabled: true, comingSoon: false },
      posts:         { enabled: true, comingSoon: false },
      media:         { enabled: true, comingSoon: false },
      albums:        { enabled: true, comingSoon: false }
    },
    userOverrides: {}
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
  content:     any;
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
  updateContent:  (data: any) => void;
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
    const co = sessionStorage.getItem("euc_session_content");
    
    // Fallback if tripInfo is missing from cache but everything else is there
    const parsedTripInfo = ti ? JSON.parse(ti) : null;
    const parsedAppConfig = ac ? JSON.parse(ac) : null;
    const parsedContent = co ? JSON.parse(co) : DEFAULT_CONTENT;
    
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
        content: parsedContent,
      };
    }
  } catch { }
  return null;
}

function writeSessionCache(data: { users: any[], schedule: any[], sessions: any[], settings: any, media: any[], tripInfo: TripInfo, appConfig: AppConfig, messages?: AppMessage[], galleries?: GalleryAlbum[], content?: any }) {
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
    if (data.content) sessionStorage.setItem("euc_session_content", JSON.stringify(data.content));
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
  const [content,  setContent]  = useState<any>(DEFAULT_CONTENT);
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
    const [u, sc, se, st, md, ti, ac, ms, ga, co] = await Promise.all([
      readJSON("users.json").then((usersList: any[]) => {
        return usersList.map((user: any) => {
          let updated = { ...user };
          if (!updated.flightDetails || !updated.flightDetails.departure || !updated.flightDetails.departure.flightNumber) {
            updated.flightDetails = getDefaultFlightDetails(updated.name);
          }
          if (!updated.hotel || !updated.hotel.name) {
            updated.hotel = getDefaultHotelDetails();
          }
          return updated;
        });
      }),
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
      readJSON("content.json").catch(() => DEFAULT_CONTENT),
    ]);

    // Merge settings with defaults
    const s = st as any;
    const mergedSettings = {
      ...s,
      scheduleCategories: [...new Set([...DEFAULT_SCHEDULE_CATEGORIES, ...(s.scheduleCategories || [])])],
      mediaCategories: [...new Set([...DEFAULT_MEDIA_CATEGORIES, ...(s.mediaCategories || [])])],
    };

    return { users: u, schedule: sc, sessions: se, settings: mergedSettings, media: md, tripInfo: ti, appConfig: ac, messages: ms, galleries: ga, content: co || DEFAULT_CONTENT };
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
        setContent(fresh.content);
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
        stableStringify(fresh.galleries) !== stableStringify(cached.galleries) ||
        stableStringify(fresh.content) !== stableStringify(cached.content);

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
        setContent(fresh.content);
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
    // 1. First, check if session exists to handle auto-login logic
    const session = loadSession();
    
    // If no explicit session and no legacy euc_user exists, just exit loading
    if (!session && !currentUser) {
      setLoading(false);
      setIsFirstLoad(false);
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const resolveAuth = (fetchedUsers: any[]) => {
      if (session) {
        const user = fetchedUsers.find((u: any) => u.id === session.userId);
        if (user) {
          if (user.active === false || user.revoked === true) {
            clearSession();
            localStorage.removeItem("euc_user");
            setCurrentUser(null);
          } else {
            setCurrentUser(user);
            localStorage.setItem("euc_user", JSON.stringify(user));
          }
        } else {
          clearSession();
          localStorage.removeItem("euc_user");
          setCurrentUser(null);
        }
      } else if (currentUser) {
        // Fallback for euc_user validation
        const matchedUser = fetchedUsers.find((u: any) => u.username === currentUser.username);
        if (matchedUser) {
          if (matchedUser.active === false || matchedUser.revoked === true) {
            localStorage.removeItem("euc_user");
            setCurrentUser(null);
          } else {
            const updatedUser = {
              ...currentUser,
              ...matchedUser,
              photoUrl: matchedUser.photoUrl || matchedUser.photo || currentUser.photoUrl || ""
            };
            setCurrentUser(updatedUser);
            localStorage.setItem("euc_user", JSON.stringify(updatedUser));
          }
        } else {
          localStorage.removeItem("euc_user");
          setCurrentUser(null);
        }
      }
    };

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
      if (cached.content) setContent(cached.content);
      
      resolveAuth(cached.users);
      
      setLoading(false);
      setIsFirstLoad(false);

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
          setContent(fresh.content || DEFAULT_CONTENT);
          writeSessionCache(fresh);

          resolveAuth(fresh.users);
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
    const enriched = data.map((user: any) => {
      if (!user.flightDetails || !user.flightDetails.departure || !user.flightDetails.departure.flightNumber) {
        return {
          ...user,
          flightDetails: getDefaultFlightDetails(user.name)
        };
      }
      return user;
    });
    setUsers(enriched);
    try { 
      sessionStorage.setItem(CACHE.users, JSON.stringify(enriched));
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

  const updateContent = useCallback((data: any) => {
    setContent(data);
    try {
      sessionStorage.setItem("euc_session_content", JSON.stringify(data));
      localStorage.setItem(CACHE.lastFetch, Date.now().toString());
    } catch {}
  }, []);

  const updateGalleries = useCallback((data: GalleryAlbum[] | ((prev: GalleryAlbum[]) => GalleryAlbum[])) => {
    setGalleries(prev => {
      const merged = typeof data === "function" ? data(prev) : data;
      try {
        sessionStorage.setItem(CACHE.galleries, JSON.stringify(merged));
        localStorage.setItem(CACHE.lastFetch, Date.now().toString());
      } catch {}
      return merged;
    });
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
      users, schedule, sessions, settings, media, tripInfo, appConfig, messages, galleries, content,
      currentUser, loading, isFirstLoad, error, isBackgroundRefreshing,
      updateUsers, updateSchedule, updateSessions, updateSettings, updateMedia, updateTripInfo, updateAppConfig, updateMessages, updateGalleries, updateContent,
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
