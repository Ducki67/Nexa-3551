import fs from "fs";
import path from "path";

function parseValue(v: string): any {
  // remove inline comments (starting with ';' or '#') unless inside quotes
  let raw = v;
  // If value isn't quoted, strip inline comment markers
  const trimmedStart = raw.trimStart();
  if (!(trimmedStart.startsWith('"') || trimmedStart.startsWith("'"))) {
    const commentIdx = raw.search(/[;#]/);
    if (commentIdx !== -1) raw = raw.slice(0, commentIdx);
  } else {
    // If quoted, try to find the closing quote and strip comment after it
    const firstChar = trimmedStart[0];
    const firstIdx = raw.indexOf(firstChar);
    const closingIdx = raw.indexOf(firstChar, firstIdx + 1);
    if (closingIdx !== -1) {
      const after = raw.slice(closingIdx + 1);
      const commentIdx = after.search(/[;#]/);
      if (commentIdx !== -1) raw = raw.slice(0, closingIdx + 1 + commentIdx);
    }
  }
  const val = raw.trim();
  if (/^(true|false)$/i.test(val)) return val.toLowerCase() === "true";
  if (val === "") return "";
  if (!Number.isNaN(Number(val))) return Number(val);
  // strip surrounding quotes for plain quoted strings
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    const inner = val.slice(1, -1);
    return inner;
  }
  return val;
}

function parseIni(content: string) {
  const out: Record<string, any> = {};
  const lines = content.split(/\r?\n/);
  let section: string | null = null;
  for (let raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    if (line.startsWith(";") || line.startsWith("#")) continue;
    if (line.startsWith("[") && line.endsWith("]")) {
      section = line.slice(1, -1).trim();
      if (!out[section]) out[section] = {};
      continue;
    }
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = parseValue(line.slice(idx + 1));
    if (section) out[section][key] = val;
    else out[key] = val;
  }
  return out;
}

function deepMerge(target: any, src: any) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === "object" && !Array.isArray(src[k])) {
      if (!target[k] || typeof target[k] !== "object") target[k] = {};
      deepMerge(target[k], src[k]);
    } else {
      target[k] = src[k];
    }
  }
}

const CONFIG_DIR = path.join(process.cwd(), "src", "config");
const store: Record<string, any> = {};

function loadAll() {
  if (!fs.existsSync(CONFIG_DIR)) return;
  const files = fs.readdirSync(CONFIG_DIR);
  for (const file of files) {
    const full = path.join(CONFIG_DIR, file);
    try {
      if (!fs.statSync(full).isFile()) continue;
      if (file.toLowerCase().endsWith(".ini")) {
        const raw = fs.readFileSync(full, "utf8");
        const parsed = parseIni(raw);
        deepMerge(store, parsed);
      } else if (file.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(fs.readFileSync(full, "utf8"));
        deepMerge(store, parsed);
      }
    } catch (e) {
      // ignore
    }
  }
}

loadAll();

function get(pathStr: string, defaultValue?: any) {
  if (!pathStr) return defaultValue;
  const parts = pathStr.split(".");
  let cur: any = store;
  for (const p of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
    else return defaultValue;
  }
  return cur;
}

function getBoolean(pathStr: string, defaultValue = false) {
  const v = get(pathStr);
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return /^(true|1)$/i.test(v);
  if (typeof v === "number") return v !== 0;
  return defaultValue;
}

export default {
  get,
  getBoolean,
  _raw: store,
};
