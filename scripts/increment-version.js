import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionPath = path.resolve(__dirname, "../src/version.json");

const version = JSON.parse(fs.readFileSync(versionPath, "utf-8"));

version.patch += 1;
version.buildTime = new Date().toISOString();
version.commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "local-dev";

fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));

const display = `v${version.major}.${version.minor}.${String(version.patch).padStart(3, "0")}`;

// Generate matching version.ts file
const tsPath = path.resolve(__dirname, "../src/version.ts");
const tsContent = `export const APP_VERSION = "${display}";\nexport const COMMIT_SHA = "${version.commitSha}";\nexport const BUILD_TIME = "${version.buildTime}";\n`;
fs.writeFileSync(tsPath, tsContent);

console.log(`Build version updated to: ${display} (commit: ${version.commitSha}, built: ${version.buildTime})`);
