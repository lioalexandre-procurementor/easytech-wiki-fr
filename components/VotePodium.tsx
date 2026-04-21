import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import type { GeneralData } from "@/lib/types";
import { BEST_GENERAL_PLACEHOLDER } from "@/lib/editorial-picks";

const PLACEHOLDER_THRESHOLD = 100;
const SIZES = [44, 52, 40] as const; // matching visual heights: 2nd, 1st, 3rd

interface PodiumEntry {
  slug: string;
  votes: number;
  general: GeneralData | undefined;
}

interface Props {
  counts: Record<string, number>;
  total: number;
  generals: GeneralData[];
  locale: string;
  heading: string;
  voteCta: string;
}

export function VotePodium({ counts, total, generals, locale, heading, voteCta }: Props) {
  const generalBySlug = new Map(generals.map((g) => [g.slug, g]));

  let top3: PodiumEntry[];

  if (total < PLACEHOLDER_THRESHOLD) {
    top3 = BEST_GENERAL_PLACEHOLDER.wc4.slice(0, 3).map((slug) => ({
      slug,
      votes: 0,
      general: generalBySlug.get(slug),
    }));
  } else {
    top3 = Object.entries(counts)
      .filter(([slug]) => generalBySlug.has(slug))
      .map(([slug, votes]) => ({ slug, votes, general: generalBySlug.get(slug)! }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3);
  }

  // Reorder for podium display: index 0=2nd place (left), 1=1st (centre), 2=3rd (right)
  const podium: (PodiumEntry | undefined)[] = [top3[1], top3[0], top3[2]];
  const medalLabels = ["🥈", "🥇", "🥉"];

  function generalName(entry: PodiumEntry): string {
    if (!entry.general) return entry.slug;
    return locale === "fr" ? entry.general.name : (entry.general.nameEn ?? entry.general.name);
  }

  return (
    <section
      aria-label={heading}
      className="bg-panel border border-gold/40 rounded-lg p-5 mb-8"
      style={{ background: "linear-gradient(135deg, rgba(212,164,74,0.08) 0%, rgba(200,55,45,0.05) 100%), #1a2230" }}
    >
      <h2 className="text-gold2 font-bold text-base mb-4 text-center">{heading}</h2>
      <div className="flex items-end justify-center gap-6 mb-4">
        {podium.map((entry, i) => {
          if (!entry) return null;
          const size = SIZES[i];
          const hasImg = !!entry.general?.image?.head;
          return (
            <Link
              key={entry.slug}
              href={`/world-conqueror-4/generaux/${entry.slug}` as any}
              className="flex flex-col items-center gap-1 no-underline group"
            >
              <div
                className="rounded-full overflow-hidden bg-panel border-2 border-border group-hover:border-gold transition-colors"
                style={{ width: size, height: size }}
              >
                {hasImg ? (
                  <Image
                    src={entry.general!.image!.head}
                    alt={generalName(entry)}
                    width={size}
                    height={size}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-lg">
                    👤
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-dim group-hover:text-gold2 transition-colors text-center max-w-[60px] truncate">
                {generalName(entry)}
              </span>
              {total >= PLACEHOLDER_THRESHOLD && (
                <span className="text-[10px] text-muted">{entry.votes.toLocaleString()}</span>
              )}
              <span className="text-lg">{medalLabels[i]}</span>
            </Link>
          );
        })}
      </div>
      <div className="text-center">
        <Link
          href="/world-conqueror-4#best-general-vote"
          className="inline-block border border-gold/40 text-gold2 text-sm font-semibold px-4 py-2 rounded-md hover:bg-gold/10 no-underline"
        >
          {voteCta}
        </Link>
      </div>
    </section>
  );
}
