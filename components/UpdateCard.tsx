import { Link } from "@/src/i18n/navigation";
import type { UpdateEntry } from "@/lib/types";

interface Props {
  update: UpdateEntry;
  locale: string;
}

export function UpdateCard({ update, locale }: Props) {
  const loc = locale as "fr" | "en" | "de";
  const title = update.title[loc] ?? update.title.en;
  const summary = update.summary[loc] ?? update.summary.en;
  const date = new Date(update.date).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/world-conqueror-4/mises-a-jour/${update.slug}` as any}
      className="bg-panel border border-border rounded-lg p-4 flex flex-col gap-1.5 hover:border-gold/50 no-underline"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-gold2 text-sm font-bold">v{update.version}</span>
        <span className="text-muted text-[11px]">{date}</span>
      </div>
      <span className="text-dim text-sm font-semibold leading-snug">{title}</span>
      <span className="text-muted text-[11px] line-clamp-2">{summary}</span>
    </Link>
  );
}
