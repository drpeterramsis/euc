import path from "path";
import fs from "fs";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Check settings.json first
    const settingsPath = path.join(process.cwd(), "data", "settings.json");
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        if (settings?.appVersion) {
          const rawVersion = settings.appVersion.trim();
          const versionStr = rawVersion.startsWith("v") ? rawVersion : `v${rawVersion}`;
          return res.status(200).json({
            version: versionStr,
            commitSha: process.env.VERCEL_GIT_COMMIT_SHA || "local-dev",
            buildTime: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Error reading application version from settings.json:", e);
      }
    }

    const versionPath = path.join(process.cwd(), "src", "version.json");
    let versionData = { major: 1, minor: 0, patch: 0, buildTime: "", commitSha: "" };

    if (fs.existsSync(versionPath)) {
      try {
        versionData = JSON.parse(fs.readFileSync(versionPath, "utf-8"));
      } catch (e) {
        console.error("Error parsing version.json:", e);
      }
    }

    const versionStr = `v${versionData.major}.${versionData.minor}.${String(versionData.patch).padStart(3, "0")}`;

    return res.status(200).json({
      version: versionStr,
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || versionData.commitSha || "local-dev",
      buildTime: versionData.buildTime || new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
