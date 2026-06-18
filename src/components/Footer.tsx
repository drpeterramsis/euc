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

  const localVersion = `v${versionData.major}.${versionData.minor}.${String(versionData.patch).padStart(3, "0")}`;
  const [verInfo, setVerInfo] = useState({
    version: localVersion,
    commitSha: (versionData as any).commitSha || "local-dev",
    buildTime: (versionData as any).buildTime || ""
  });

  useEffect(() => {
    let active = true;
    fetch("/api/version")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to load version");
      })
      .then((data) => {
        if (active && data.version) {
          setVerInfo({
            version: data.version,
            commitSha: data.commitSha || "",
            buildTime: data.buildTime || ""
          });
        }
      })
      .catch((err) => {
        console.warn("Could not fetch version API, using local fallbacks:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const formattedBuildTime = verInfo.buildTime
    ? new Date(verInfo.buildTime).toISOString().slice(0, 16).replace("T", " ")
    : "";

  const shortCommit = verInfo.commitSha && verInfo.commitSha !== "local-dev"
    ? verInfo.commitSha.slice(0, 7)
    : verInfo.commitSha;

  const versionDetails = verInfo.version;

  return (
    <footer className="p-4 border-t border-gray-200 bg-white text-center text-sm text-gray-500">
      <p>© 2026 EUC – EVA UROLOGY COMMUNITY</p>
      <p className="mt-1">Developed by: Dr. Peter Ramsis | <span className="text-xs text-gray-400 font-mono">{versionDetails}</span></p>
    </footer>
  );
}
