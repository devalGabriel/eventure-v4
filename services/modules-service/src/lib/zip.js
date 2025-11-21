import AdmZip from "adm-zip";
import fs from "node:fs";
import path from "node:path";

export function extractZipTo(zipBuffer, targetDir) {
  const zip = new AdmZip(zipBuffer);
  zip.extractAllTo(targetDir, true);
}
export function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
export function fileExists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
export function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
export function rmrf(p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch { } }
export function join(...a) { return path.join(...a); }
export const resolve = path.resolve;
