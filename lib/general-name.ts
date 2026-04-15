/**
 * Split a general's display name into "family name" (always the last
 * whitespace-separated token) and "given name(s)" (everything before).
 *
 * Heuristic is good enough for 99% of WW2 general names in the roster.
 * Edge cases ("de Gaulle", "von Bock") put the particle with the given
 * name, which is an acceptable display compromise for first-pass work.
 *
 * For single-word names (e.g., "Osborn", "Williams", "Wu") the given
 * name returns empty — the UI should render just the family name.
 */
export function splitGeneralName(display: string): { family: string; given: string } {
  if (!display) return { family: "", given: "" };
  const parts = display.trim().split(/\s+/);
  if (parts.length === 1) return { family: parts[0], given: "" };
  const family = parts[parts.length - 1];
  const given = parts.slice(0, -1).join(" ");
  return { family, given };
}
