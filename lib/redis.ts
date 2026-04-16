import { Redis } from "@upstash/redis";
import type { Game } from "./types";

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

/**
 * Per-general skill-slot vote key. Stays WC4-only — per-general skill
 * voting is only surfaced on WC4 general pages (other games don't yet
 * have the skill-slot UI).
 */
export function voteKey(general: string, slot: number) {
  return `vote:wc4:gen:${general}:slot${slot}`;
}

/** Redis hash key for the "best general for elite unit X" community vote. */
export function unitGeneralVoteKey(game: Game, unitSlug: string) {
  return `vote:${game}:unit-general:${unitSlug}`;
}

/** Redis hash key for the "best general overall" community vote (per game). */
export function bestGeneralVoteKey(game: Game) {
  return `vote:${game}:best-general`;
}
