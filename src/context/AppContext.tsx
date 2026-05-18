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
  lastFetch: "euc_last_fetch_time",
};

const REFRESH_INTERVAL = 10 * 60 * 1000;

interface AppContextType {
  users:       any[];
  schedule:    any[];
  sessions:    any[];
  settings:    any;
  currentUser: any;
  loading:     boolean;
  isFirstLoad: boolean;
  error:       string | null;
  isBackgroundRefreshing: boolean;
  updateUsers:    (data: any[])  => void;
  updateSchedule: (data: any[])  => void;
  updateSessions: (data: any[])  => void;
  updateSettings: (data: any)    => void;
  refreshData:    () => Promise<void>;
  loginUser:      (user: any) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function readSessionCache() {
  try {
    const u  = sessionStorage.getItem(CACHE.users);
    const sc = sessionStorage.getItem(CACHE.schedule);
    const se = sessionStorage.getItem(CACHE.sessions);
    const st = sessionStorage.getItem(CACHE.settings);
    if (u && sc && se && st) {
      return {
        users:    JSON.parse(u),
        schedule: JSON.parse(sc),
        sessions: JSON.parse(se),
        settings: JSON.parse(st),
      };
    }
  } catch { }
  return null;
}

function writeSessionCache(data: { users: any[], schedule: any[], sessions: any[], settings: any }) {
  try {
    sessionStorage.setItem(CACHE.users,    JSON.stringify(data.users));
    sessionStorage.setItem(CACHE.schedule, JSON.stringify(data.schedule));
    sessionStorage.setItem(CACHE.sessions, JSON.stringify(data.sessions));
    sessionStorage.setItem(CACHE.settings, JSON.stringify(data.settings));
    localStorage.setItem(CACHE.lastFetch,  Date.now().toString());
  } catch { }
}

function needsBackgroundRefresh(): boolean {
  const last = localStorage.getItem(CACHE.lastFetch);
  if (!last) return true;
  return Date.now() - parseInt(last) > REFRESH_INTERVAL;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users,    setUsers]    = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading,  setLoading]  = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);

  const fetchedRef = useRef(false);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("euc_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const fetchFreshData = useCallback(async () => {
    const [u, sc, se, st] = await Promise.all([
      readJSON("users.json"),
      readJSON("schedule.json"),
      readJSON("sessions.json"),
      readJSON("settings.json"),
    ]);
    return { users: u, schedule: sc, sessions: se, settings: st };
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
        writeSessionCache(fresh);
        return;
      }

      const changed = 
        stableStringify(fresh.users) !== stableStringify(cached.users) ||
        stableStringify(fresh.schedule) !== stableStringify(cached.schedule) ||
        stableStringify(fresh.sessions) !== stableStringify(cached.sessions) ||
        stableStringify(fresh.settings) !== stableStringify(cached.settings);

      if (changed) {
        setUsers(fresh.users);
        setSchedule(fresh.schedule);
        setSessions(fresh.sessions);
        setSettings(fresh.settings);
        writeSessionCache(fresh);
      }
    } catch {
      console.warn("Background refresh failed — using cached data");
    } finally {
      setIsBackgroundRefreshing(false);
    }
  }, [fetchFreshData]);

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
      setLoading(false);
      setIsFirstLoad(false);

      // ALWAYS run a background refresh on mount when user is logged in
      setTimeout(() => backgroundRefresh(), 2000);
    } else {
      setLoading(true);
      fetchFreshData()
        .then(fresh => {
          setUsers(fresh.users);
          setSchedule(fresh.schedule);
          setSessions(fresh.sessions);
          setSettings(fresh.settings);
          writeSessionCache(fresh);
        })
        .catch(() => {
          setError("Failed to load data. Please refresh.");
        })
        .finally(() => {
          setLoading(false);
          setIsFirstLoad(false);
        });
    }
  }, [currentUser]); // using currentUser instead of empty array so login sets state

  const loginUser = useCallback((user: any) => {
    localStorage.setItem("euc_user", JSON.stringify(user));
    setCurrentUser(user);
    // Remove fetchedRef bypass on login if re-logging in same session
    fetchedRef.current = false;
  }, []);

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

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await fetchFreshData();
      setUsers(fresh.users);
      setSchedule(fresh.schedule);
      setSessions(fresh.sessions);
      setSettings(fresh.settings);
      writeSessionCache(fresh);
    } catch {
      setError("Failed to refresh data.");
    } finally {
      setLoading(false);
    }
  }, [fetchFreshData]);

  return (
    <AppContext.Provider value={{
      users, schedule, sessions, settings,
      currentUser, loading, isFirstLoad, error, isBackgroundRefreshing,
      updateUsers, updateSchedule, updateSessions, updateSettings,
      refreshData, loginUser,
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
