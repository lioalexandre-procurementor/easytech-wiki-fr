import Image from "next/image";
import { Link } from "@/src/i18n/navigation";

export type HeroPortrait = { slug: string; name: string; head: string };

/**
 * Decorative-but-real portrait cluster for the hero. Five top WC4 generals
 * arranged in an overlapping deck with gold rings and a soft glow, floating
 * gently. Each links to its general page (so it earns its place as real
 * navigation, not just chrome). Hidden below lg — the hero collapses to a
 * single column on mobile where vertical space is precious.
 *
 * Positions are percentages inside a square container so the cluster scales
 * cleanly with the column width.
 */
const SLOTS = [
  { top: "2%", left: "30%", size: 168, z: 30, delay: "0s" },
  { top: "30%", left: "2%", size: 116, z: 20, delay: "0.4s" },
  { top: "26%", left: "63%", size: 132, z: 20, delay: "0.8s" },
  { top: "62%", left: "20%", size: 120, z: 25, delay: "1.2s" },
  { top: "60%", left: "58%", size: 104, z: 15, delay: "1.6s" },
];

export function HeroPortraits({ portraits }: { portraits: HeroPortrait[] }) {
  const items = portraits.slice(0, SLOTS.length);
  return (
    <div className="relative w-full aspect-square max-w-[440px] mx-auto">
      {/* Glow backdrop */}
      <div
        className="etw-glow absolute inset-[12%] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--c-gold) / 0.35) 0%, rgb(var(--c-accent) / 0.12) 40%, transparent 70%)",
          filter: "blur(8px)",
        }}
        aria-hidden="true"
      />
      <div className="etw-float absolute inset-0">
        {items.map((p, i) => {
          const s = SLOTS[i];
          return (
            <Link
              key={p.slug}
              href={`/world-conqueror-4/generaux/${p.slug}` as any}
              className="absolute group no-underline"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                zIndex: s.z,
                animationDelay: s.delay,
              }}
              title={p.name}
            >
              <span
                className="block w-full h-full rounded-full overflow-hidden border-2 border-gold/60 bg-panel transition-transform duration-200 group-hover:scale-105 group-hover:border-gold"
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}
              >
                <Image
                  src={p.head}
                  alt={p.name}
                  width={s.size}
                  height={s.size}
                  className="object-cover w-full h-full"
                  priority={i === 0}
                />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
