import type { Tech } from "@/lib/types";
import type { Locale } from "@/src/i18n/config";
import { TechCard } from "./TechCard";

/**
 * Lay out techs in a grid using their APK Position[x,y]. Each tech's
 * canonical position comes from level 1 (or the first available level).
 *
 * Falls back to a flat alphabetical grid when positions are missing.
 * On mobile (<lg), the wide APK-position grid would overflow horizontally,
 * so we render a simple responsive grid sorted by APK row then column.
 */
export function TechTreeGrid({
  techs,
  locale,
}: {
  techs: Tech[];
  locale: Locale;
}) {
  const allXY = techs
    .map((t) => t.levels[0])
    .filter((l) => l && typeof l.x === "number" && typeof l.y === "number");

  if (allXY.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {techs.map((t) => (
          <TechCard key={t.slug} tech={t} locale={locale} />
        ))}
      </div>
    );
  }

  const maxX = Math.max(...allXY.map((l) => l!.x));

  const sortedForMobile = [...techs].sort((a, b) => {
    const la = a.levels[0];
    const lb = b.levels[0];
    const ay = la?.y ?? 999;
    const by = lb?.y ?? 999;
    if (ay !== by) return ay - by;
    const ax = la?.x ?? 999;
    const bx = lb?.x ?? 999;
    return ax - bx;
  });

  return (
    <>
      {/* Mobile / tablet: simple responsive grid, APK positions ignored */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 lg:hidden">
        {sortedForMobile.map((t) => (
          <TechCard key={t.slug} tech={t} locale={locale} />
        ))}
      </div>

      {/* Desktop: APK-position grid */}
      <div
        className="hidden lg:grid gap-3"
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
    </>
  );
}
