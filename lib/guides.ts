import fs from "node:fs";
import path from "node:path";
import type { Guide } from "./types";

const GUIDES_DIR = path.join(process.cwd(), "content", "guides", "wc4");

export function getAllGuideSlugs(): string[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function getGuide(slug: string): Guide | null {
  const p = path.join(GUIDES_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Guide;
}

export function getAllGuides(): Guide[] {
  return getAllGuideSlugs()
    .map((s) => getGuide(s))
    .filter((g): g is Guide => g !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
