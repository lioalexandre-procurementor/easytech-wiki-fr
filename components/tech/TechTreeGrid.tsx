import type { Tech } from "@/lib/types";
import { TechCard } from "./TechCard";

/**
 * Lay out techs in a grid using their APK Position[x,y]. Each tech's
 * canonical position comes from level 1 (or the first available level).
 *
 * Falls back to a flat alphabetical grid when positions are missing.
 */
export function TechTreeGrid({
  techs,
  locale,
}: {
  techs: Tech[];
  locale: "fr" | "en";
}) {
  // Determine bounds.
  const allXY = techs
    .map((t) => t.levels[0])
    .filter((l) => l && typeof l.x === "number" && typeof l.y === "number");

  if (allXY.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techs.map((t) => (
          <TechCard key={t.slug} tech={t} locale={locale} />
        ))}
      </div>
    );
  }

  const maxX = Math.max(...allXY.map((l) => l!.x));
  const maxY = Math.max(...allXY.map((l) => l!.y));

  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${maxX + 1}, minmax(0, 1fr))`,
        gridAutoRows: "minmax(120px, auto)",
      }}
    >
      {techs.map((t) => {
        const lv = t.levels[0];
        if (!lv || typeof lv.x !== "number" || typeof lv.y !== "number")
          return null;
        return (
          <div
            key={t.slug}
            style={{
              gridColumnStart: lv.x + 1,
              gridRowStart: lv.y + 1,
            }}
          >
            <TechCard tech={t} locale={locale} />
          </div>
        );
      })}
    </div>
  );
}
