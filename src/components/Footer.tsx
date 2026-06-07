/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import versionData from "../version.json";

export default function Footer() {
  const appContext = useApp();
  const settings = appContext?.settings;
  
  const appVersion = `v${versionData.major}.${versionData.minor}.${String(versionData.patch).padStart(3, "0")}`;

  return (
    <footer className="p-4 border-t border-gray-200 bg-white text-center text-sm text-gray-500">
      <p>© 2026 EUC – EVA UROLOGY COMMUNITY</p>
      <p className="mt-1">Developed by: Dr. Peter Ramsis | <span className="text-xs text-gray-400">{appVersion}</span></p>
    </footer>
  );
}
