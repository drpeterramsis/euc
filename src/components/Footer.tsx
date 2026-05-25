/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { APP_VERSION } from "../version";

export default function Footer() {
  const appContext = useApp();
  const settings = appContext?.settings;
  const [localVersion, setLocalVersion] = useState<string | null>(() => {
    return localStorage.getItem("appVersion") || null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setLocalVersion(localStorage.getItem("appVersion"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const version = settings?.appVersion || localVersion || APP_VERSION || "—";

  return (
    <footer className="p-4 border-t border-gray-200 bg-white text-center text-sm text-gray-500">
      <p>© 2026 EUC – EVA UROLOGY COMMUNITY</p>
      <p className="mt-1">Developed by: Dr. Peter Ramsis | <span className="text-xs text-gray-400">v{version}</span></p>
    </footer>
  );
}
