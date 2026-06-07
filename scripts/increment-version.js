import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionPath = path.resolve(__dirname, "../src/version.json");

const version = JSON.parse(fs.readFileSync(versionPath, "utf-8"));

version.patch += 1;

fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));

const display = `v${version.major}.${version.minor}.${String(version.patch).padStart(3, "0")}`;

console.log(`Build version updated to: ${display}`);
