import { Link } from "@/src/i18n/navigation";
import type { Tech } from "@/lib/types";

export function TechCard({ tech, locale }: { tech: Tech; locale: "fr" | "en" }) {
  const name = locale === "fr" ? tech.nameFr || tech.nameEn : tech.nameEn;
  return (
    <Link
      href={`/world-conqueror-4/technologies/${tech.slug}` as any}
      className="block bg-panel border border-border rounded-lg p-4 hover:border-gold transition-colors no-underline"
    >
      <h3 className="text-gold2 font-bold text-base mb-1">{name}</h3>
      <div className="text-muted text-[10px] uppercase tracking-widest">
        L1 → L{tech.maxLevel}
      </div>
      {tech.levels[0]?.descEn && (
        <p className="text-dim text-xs leading-relaxed mt-2 line-clamp-3">
          {tech.levels[0].descEn}
        </p>
      )}
    </Link>
  );
}
