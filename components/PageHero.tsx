import type { ReactNode } from "react";

/**
 * Contained cinematic header for interior pages (game hub + list pages).
 *
 * Same visual language as the homepage hero — hex-grid texture, a breathing
 * gold glow, eyebrow chip, strong ink title, dim subtitle — but bounded in a
 * rounded panel so it drops into any container, including the narrow main
 * column of the sidebar list pages. Entrance via the shared `etw-rise`.
 */
const HEX_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='46'%3E%3Cpath d='M20 1 38 12 38 34 20 45 2 34 2 12Z' fill='none' stroke='%23d4a44a' stroke-width='0.5'/%3E%3C/svg%3E\")";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** CTAs, stat chips, etc. rendered below the subtitle. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`etw-rise relative overflow-hidden rounded-2xl border border-border shadow-panel ${className}`}
      style={{ background: "var(--grad-hero)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.16]"
        style={{ backgroundImage: HEX_BG }}
        aria-hidden="true"
      />
      <div
        className="etw-glow absolute -top-28 -right-20 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--c-gold) / 0.22) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div className="relative p-7 md:p-9">
        {eyebrow ? (
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold2 border border-gold/30 bg-gold/5 rounded-full px-3 py-1.5">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-ink leading-[1.1]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-dim text-base max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}

/** Gold left-rule stat for use inside a PageHero's children row. */
export function HeroStat({ n, l }: { n: ReactNode; l: ReactNode }) {
  return (
    <div className="border-l-4 border-gold pl-3">
      <div className="text-2xl text-gold2 font-extrabold tabular-nums leading-none">
        {n}
      </div>
      <div className="text-[11px] text-muted uppercase tracking-widest mt-1.5">
        {l}
      </div>
    </div>
  );
}
