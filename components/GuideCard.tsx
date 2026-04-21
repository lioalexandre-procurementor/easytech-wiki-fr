import { Link } from "@/src/i18n/navigation";
import type { Guide, GuideCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<GuideCategory, string> = {
  starter: "text-amber-400",
  systems: "text-blue-400",
  strategy: "text-green-400",
  meta: "text-purple-400",
};

interface Props {
  guide: Guide;
  locale: string;
}

export function GuideCard({ guide, locale }: Props) {
  const loc = locale as "fr" | "en" | "de";
  const title = guide.title[loc] ?? guide.title.en;
  const colorClass = CATEGORY_COLORS[guide.category] ?? "text-muted";
  const date = new Date(guide.publishedAt).toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/world-conqueror-4/guides/${guide.slug}` as any}
      className="bg-panel border border-border rounded-lg p-4 flex flex-col gap-2 hover:border-gold/50 no-underline"
    >
      <span className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
        {guide.category}
      </span>
      <span className="text-dim text-sm font-semibold leading-snug line-clamp-2">{title}</span>
      <span className="text-muted text-[11px] mt-auto">
        {date} · {guide.readingTimeMinutes} min
      </span>
    </Link>
  );
}
