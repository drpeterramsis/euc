// ─────────────────────────────────────────────────────────
// FILE: src/context/AppContext.tsx
// PURPOSE: Global state manager — loads all JSON data once
// after login and shares with all pages via React Context.
// No page should ever fetch data independently.
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
  error: string | null;
  refreshData: () => Promise<void>;
  updateUsers: (users: any[]) => void;
}

const AppContext = createContext<AppData | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionRaw = localStorage.getItem("euc_user");
  const currentUser = sessionRaw ? JSON.parse(sessionRaw) : null;

  async function loadAllData() {
    try {
      setLoading(true);
      setError(null);
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
    } catch (err) {
      setError("Failed to load app data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser) loadAllData();
    else setLoading(false);
  }, []);

  function updateUsers(newUsers: any[]) {
    setUsers(newUsers);
  }

  return (
    <AppContext.Provider value={{
      users, schedule, sessions, settings,
      currentUser, loading, error,
      refreshData: loadAllData,
      updateUsers,
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
