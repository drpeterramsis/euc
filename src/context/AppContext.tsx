// ─────────────────────────────────────────────────────────
// FILE: src/context/AppContext.tsx
// PURPOSE: Global state manager — loads all JSON data once
// after login and shares with all pages via React Context.
// ─────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from "react";
import { readJSON } from "../utils/github";

interface AppData {
  users: any[];
  schedule: any[];
  sessions: any[];
  settings: any;
  currentUser: any;
  loading: boolean;
  isFirstLoad: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateUsers: (users: any[]) => void;
  loginUser: (user: any) => void;
}

const AppContext = createContext<AppData | null>(null);

const SESSION_KEYS = {
  users: "euc_session_users",
  schedule: "euc_session_schedule",
  sessions: "euc_session_sessions",
  settings: "euc_session_settings",
};

export function clearSessionCache() {
  Object.values(SESSION_KEYS).forEach(key => sessionStorage.removeItem(key));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const sessionRaw = localStorage.getItem("euc_user");
    return sessionRaw ? JSON.parse(sessionRaw) : null;
  });

  const [isFirstLoad, setIsFirstLoad] = useState(() => {
    return !sessionStorage.getItem("euc_session_users");
  });

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const cachedUsers = sessionStorage.getItem(SESSION_KEYS.users);
    const cachedSchedule = sessionStorage.getItem(SESSION_KEYS.schedule);
    const cachedSessions = sessionStorage.getItem(SESSION_KEYS.sessions);
    const cachedSettings = sessionStorage.getItem(SESSION_KEYS.settings);

    if (cachedUsers && cachedSchedule && cachedSessions && cachedSettings) {
      setUsers(JSON.parse(cachedUsers));
      setSchedule(JSON.parse(cachedSchedule));
      setSessions(JSON.parse(cachedSessions));
      setSettings(JSON.parse(cachedSettings));
      setLoading(false);
      setIsFirstLoad(false);
      return;
    }

    loadAllData();
  }, [currentUser]); // Trigger load when currentUser changes (e.g., after login)

  async function loadAllData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [u, sc, se, st] = await Promise.all([
        readJSON("users.json"),
        readJSON("schedule.json"),
        readJSON("sessions.json"),
        readJSON("settings.json"),
      ]);
      setUsers(u);
      setSchedule(sc);
      setSessions(se);
      setSettings(st);

      sessionStorage.setItem(SESSION_KEYS.users, JSON.stringify(u));
      sessionStorage.setItem(SESSION_KEYS.schedule, JSON.stringify(sc));
      sessionStorage.setItem(SESSION_KEYS.sessions, JSON.stringify(se));
      sessionStorage.setItem(SESSION_KEYS.settings, JSON.stringify(st));
    } catch (err) {
      setError("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  }

  function loginUser(user: any) {
    localStorage.setItem("euc_user", JSON.stringify(user));
    setCurrentUser(user);
    // Data load will be triggered by useEffect
  }

  async function refreshInBackground() {
    try {
      const [u, sc, se, st] = await Promise.all([
        readJSON("users.json"),
        readJSON("schedule.json"),
        readJSON("sessions.json"),
        readJSON("settings.json"),
      ]);
      setUsers(u);
      setSchedule(sc);
      setSessions(se);
      setSettings(st);
      sessionStorage.setItem(SESSION_KEYS.users, JSON.stringify(u));
      sessionStorage.setItem(SESSION_KEYS.schedule, JSON.stringify(sc));
      sessionStorage.setItem(SESSION_KEYS.sessions, JSON.stringify(se));
      sessionStorage.setItem(SESSION_KEYS.settings, JSON.stringify(st));
    } catch {}
  }

  function updateUsers(newUsers: any[]) {
    setUsers(newUsers);
    sessionStorage.setItem(SESSION_KEYS.users, JSON.stringify(newUsers));
  }

  return (
    <AppContext.Provider value={{
      users, schedule, sessions, settings,
      currentUser, loading, isFirstLoad, error,
      refreshData: () => loadAllData(false),
      updateUsers,
      loginUser,
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
