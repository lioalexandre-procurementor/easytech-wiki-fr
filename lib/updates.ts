import fs from "node:fs";
import path from "node:path";
import type { UpdateEntry } from "./types";

const UPDATES_DIR = path.join(process.cwd(), "data", "wc4", "updates");

function load(slug: string): UpdateEntry | null {
  const p = path.join(UPDATES_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as UpdateEntry;
}

export function getAllUpdateSlugs(): string[] {
  if (!fs.existsSync(UPDATES_DIR)) return [];
  return fs
    .readdirSync(UPDATES_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function getAllUpdates(): UpdateEntry[] {
  return getAllUpdateSlugs()
    .map((s) => load(s))
    .filter((u): u is UpdateEntry => u !== null)
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first
}

export function getUpdate(slug: string): UpdateEntry | null {
  return load(slug);
}
