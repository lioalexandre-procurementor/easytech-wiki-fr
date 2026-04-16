"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

type VoteApiResponse = {
  counts: Record<string, number>;
  total: number;
  hasVoted: boolean;
  disabled?: boolean;
  error?: string;
};

export type Candidate = {
  slug: string;
  name: string;        // FR display (from JSON data)
  nameEn?: string;     // EN canonical
  rank: "S" | "A" | "B" | "C" | null;
  country?: string | null;
};

type Props = {
  unitSlug: string;
  unitDisplayName: string;
  candidates: Candidate[];
  /** When total votes < threshold, the widget shows a "not enough data yet"
   *  placeholder instead of a leaderboard. Pass `0` to always show results. */
  threshold?: number;
};

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "invisible";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${TURNSTILE_SRC}"]`
  );
  if (existing) {
    return new Promise((resolve) => {
      if (window.turnstile) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
    });
  }
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

/**
 * LABELS — 3-locale strings local to this widget, matching the
 * FR/EN/DE pattern used by MobileNavDrawer / ReportMistakeLink /
 * BestGeneralVote. No dependency on `next-intl` message catalog so
 * the component can be dropped into any page without touching JSON.
 */
const LABELS: Record<
  string,
  {
    heading: string;
    placeholder: (threshold: number) => string;
    progressTo: (current: number, threshold: number) => string;
    communityPick: string;
    voteCta: string;
    thanks: string;
    openModal: string;
    modalTitle: (name: string) => string;
    modalIntro: string;
    cancel: string;
    confirm: string;
    submitting: string;
    close: string;
    errAlready: string;
    errCaptcha: string;
    errSubmit: string;
    errConnection: string;
    captchaMissing: string;
    rankLabel: string;
    totalVotes: (n: number) => string;
    search: string;
    noMatch: string;
  }
> = {
  fr: {
    heading: "🏆 Meilleur général selon la communauté",
    placeholder: (n) =>
      `Pas encore assez de votes. La recommandation communautaire s'affiche à partir de ${n} votes.`,
    progressTo: (c, n) => `${c} / ${n} votes`,
    communityPick: "Choix de la communauté",
    voteCta: "🗳 Voter pour votre général",
    thanks: "✓ Merci — votre vote est enregistré (valide 30 jours)",
    openModal: "Ouvrir le vote",
    modalTitle: (name) => `Quel général pour ${name} ?`,
    modalIntro:
      "Votez pour le général que vous estimez le plus efficace sur cette unité d'élite. Un vote par visiteur, valable 30 jours.",
    cancel: "Annuler",
    confirm: "Confirmer",
    submitting: "Envoi…",
    close: "Fermer",
    errAlready: "Vous avez déjà voté pour cette unité.",
    errCaptcha: "La vérification anti-bot a échoué. Réessayez.",
    errSubmit: "Erreur lors de l'envoi du vote.",
    errConnection: "Connexion perdue. Réessayez dans un instant.",
    captchaMissing: "Complétez la vérification anti-bot.",
    rankLabel: "Tier",
    totalVotes: (n) =>
      n === 1 ? "1 vote au total" : `${n} votes au total`,
    search: "Rechercher un général…",
    noMatch: "Aucun général ne correspond.",
  },
  en: {
    heading: "🏆 Community's top-pick general",
    placeholder: (n) =>
      `Not enough votes yet. The community pick shows up once ${n} votes are cast.`,
    progressTo: (c, n) => `${c} / ${n} votes`,
    communityPick: "Community pick",
    voteCta: "🗳 Vote for your general",
    thanks: "✓ Thanks — your vote is counted (valid 30 days)",
    openModal: "Open vote",
    modalTitle: (name) => `Best general for ${name}?`,
    modalIntro:
      "Vote for the general you think pairs best with this elite unit. One vote per visitor, valid 30 days.",
    cancel: "Cancel",
    confirm: "Confirm",
    submitting: "Submitting…",
    close: "Close",
    errAlready: "You have already voted for this unit.",
    errCaptcha: "Anti-bot check failed. Please try again.",
    errSubmit: "Error submitting your vote.",
    errConnection: "Connection lost. Please retry in a moment.",
    captchaMissing: "Please complete the anti-bot check.",
    rankLabel: "Tier",
    totalVotes: (n) => (n === 1 ? "1 total vote" : `${n} total votes`),
    search: "Search a general…",
    noMatch: "No general matches.",
  },
  de: {
    heading: "🏆 Community-Favorit",
    placeholder: (n) =>
      `Noch nicht genug Stimmen. Die Community-Empfehlung erscheint ab ${n} Stimmen.`,
    progressTo: (c, n) => `${c} / ${n} Stimmen`,
    communityPick: "Community-Wahl",
    voteCta: "🗳 Für deinen General abstimmen",
    thanks: "✓ Danke — deine Stimme wurde gezählt (30 Tage gültig)",
    openModal: "Abstimmung öffnen",
    modalTitle: (name) => `Welcher General für ${name}?`,
    modalIntro:
      "Stimme für den General, der deiner Meinung nach am besten zu dieser Elite-Einheit passt. Eine Stimme pro Besucher, 30 Tage gültig.",
    cancel: "Abbrechen",
    confirm: "Bestätigen",
    submitting: "Wird übermittelt…",
    close: "Schließen",
    errAlready: "Du hast für diese Einheit bereits abgestimmt.",
    errCaptcha: "Anti-Bot-Prüfung fehlgeschlagen. Bitte erneut versuchen.",
    errSubmit: "Fehler beim Übermitteln der Stimme.",
    errConnection: "Verbindung verloren. Bitte gleich erneut versuchen.",
    captchaMissing: "Bitte schließe die Anti-Bot-Prüfung ab.",
    rankLabel: "Tier",
    totalVotes: (n) => (n === 1 ? "1 Stimme insgesamt" : `${n} Stimmen insgesamt`),
    search: "General suchen…",
    noMatch: "Kein General entspricht.",
  },
};

const RANK_COLOR: Record<string, string> = {
  S: "bg-red-500/20 border-red-500/40 text-red-300",
  A: "bg-gold/20 border-gold/40 text-gold2",
  B: "bg-blue-500/15 border-blue-500/40 text-blue-300",
  C: "bg-border text-dim",
};

export default function UnitBestGeneralVote({
  unitSlug,
  unitDisplayName,
  candidates,
  threshold = 100,
}: Props) {
  const locale = useLocale();
  const L = LABELS[locale] ?? LABELS.en;
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const widgetContainer = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/vote/unit-general?unit=${encodeURIComponent(unitSlug)}`, {
      cache: "no-store",
    })
      .then((r) => r.json() as Promise<VoteApiResponse>)
      .then((d) => {
        if (cancelled) return;
        setCounts(d.counts || {});
        setTotal(d.total || 0);
        setHasVoted(Boolean(d.hasVoted));
        setDisabled(Boolean(d.disabled));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDisabled(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [unitSlug]);

  useEffect(() => {
    if (!modalOpen || disabled || !siteKey) return;
    let active = true;
    loadTurnstile().then(() => {
      if (!active || !window.turnstile || !widgetContainer.current) return;
      if (widgetId.current) {
        window.turnstile.reset(widgetId.current);
        setTurnstileToken(null);
        return;
      }
      widgetId.current = window.turnstile.render(widgetContainer.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (tk) => setTurnstileToken(tk),
        "error-callback": () => setTurnstileToken(null),
        "expired-callback": () => setTurnstileToken(null),
      });
    });
    return () => {
      active = false;
    };
  }, [modalOpen, disabled, siteKey]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

  const submit = useCallback(async () => {
    if (!selected) return;
    if (siteKey && !turnstileToken) {
      setErr(L.captchaMissing);
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/vote/unit-general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit: unitSlug,
          general: selected,
          turnstileToken,
        }),
      });
      const data = (await res.json()) as VoteApiResponse;
      if (!res.ok) {
        setErr(
          data.error === "already voted"
            ? L.errAlready
            : data.error === "captcha failed"
            ? L.errCaptcha
            : L.errSubmit
        );
        setSubmitting(false);
        return;
      }
      setCounts(data.counts || {});
      setTotal(data.total || 0);
      setHasVoted(true);
      setModalOpen(false);
    } catch {
      setErr(L.errConnection);
    } finally {
      setSubmitting(false);
    }
  }, [selected, siteKey, turnstileToken, unitSlug, L]);

  const ranked = candidates
    .map((c) => ({ ...c, votes: counts[c.slug] || 0 }))
    .sort((a, b) => b.votes - a.votes);
  const top = ranked.slice(0, 3);
  const belowThreshold = total < threshold;

  if (disabled) {
    // Voting backend unreachable — render nothing rather than a broken widget.
    return null;
  }

  const displayName = (c: Candidate) => c.nameEn || c.name;

  const filteredCandidates = candidates.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.nameEn ?? "").toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mt-4 border border-gold/40 rounded-lg p-4 bg-gradient-to-br from-gold/10 to-transparent">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h5 className="text-gold2 font-extrabold uppercase tracking-widest text-xs md:text-sm">
          {L.heading}
        </h5>
        <span className="text-muted text-[10px] uppercase tracking-widest">
          {L.totalVotes(total)}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-5 rounded bg-border/40 animate-pulse" />
          <div className="h-5 rounded bg-border/40 animate-pulse w-2/3" />
        </div>
      ) : belowThreshold ? (
        // Placeholder until threshold is reached
        <div className="bg-bg3/60 border border-dashed border-gold/30 rounded p-3">
          <p className="text-dim text-xs md:text-sm italic mb-2 leading-relaxed">
            {L.placeholder(threshold)}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-red-500 transition-all"
                style={{
                  width: `${Math.min(100, (total / threshold) * 100)}%`,
                }}
              />
            </div>
            <span className="tabular-nums whitespace-nowrap">
              {L.progressTo(total, threshold)}
            </span>
          </div>
        </div>
      ) : (
        <ol className="space-y-1.5">
          {top.map((c, i) => {
            const pct = total > 0 ? Math.round((c.votes / total) * 100) : 0;
            const medal = ["🥇", "🥈", "🥉"][i];
            return (
              <li
                key={c.slug}
                className="flex items-center gap-2 text-sm"
              >
                <span className="text-base w-5 text-center" aria-hidden="true">
                  {medal}
                </span>
                <a
                  href={`/${locale}/world-conqueror-4/generaux/${c.slug}`}
                  className="flex-1 text-gold2 hover:underline truncate no-underline"
                >
                  {displayName(c)}
                </a>
                {c.rank && (
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${RANK_COLOR[c.rank] ?? RANK_COLOR.C}`}
                  >
                    {c.rank}
                  </span>
                )}
                <span className="text-gold2 font-bold text-xs tabular-nums shrink-0">
                  {c.votes}
                </span>
                <span className="text-muted text-[10px] tabular-nums w-10 text-right shrink-0">
                  ({pct}%)
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-3">
        {hasVoted ? (
          <div className="text-center text-xs text-gold2 py-2 border border-gold/30 rounded bg-gold/5">
            {L.thanks}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setErr(null);
              setQuery("");
              setModalOpen(true);
            }}
            className="w-full py-2.5 rounded-full border border-gold bg-gold/15 text-gold2 text-xs md:text-sm font-extrabold uppercase tracking-widest hover:bg-gold/25 hover:shadow-[0_2px_8px_rgba(212,164,74,0.3)] transition-all"
          >
            {L.voteCta}
          </button>
        )}
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={L.modalTitle(unitDisplayName)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-panel border border-border rounded-lg w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-sm leading-snug">
                {L.modalTitle(unitDisplayName)}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-gold2 text-xl leading-none w-8 h-8 shrink-0"
                aria-label={L.close}
              >
                ×
              </button>
            </div>

            <div className="p-4 border-b border-border">
              <p className="text-dim text-xs mb-2 leading-relaxed">
                {L.modalIntro}
              </p>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={L.search}
                className="w-full bg-bg3 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-gold"
              />
            </div>

            <div className="overflow-y-auto p-3 space-y-1 flex-1">
              {filteredCandidates.length === 0 ? (
                <p className="text-muted text-xs italic py-4 text-center">
                  {L.noMatch}
                </p>
              ) : (
                filteredCandidates.map((c) => {
                  const v = counts[c.slug] || 0;
                  const checked = selected === c.slug;
                  return (
                    <label
                      key={c.slug}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded cursor-pointer border transition-colors ${
                        checked
                          ? "border-gold bg-gold/10"
                          : "border-transparent hover:bg-bg3 hover:border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="unit-vote-choice"
                        value={c.slug}
                        checked={checked}
                        onChange={() => setSelected(c.slug)}
                        className="accent-gold"
                      />
                      <span className="flex-1 text-sm text-ink truncate">
                        {displayName(c)}
                      </span>
                      {c.rank && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${RANK_COLOR[c.rank] ?? RANK_COLOR.C}`}
                        >
                          {c.rank}
                        </span>
                      )}
                      <span className="text-muted text-[11px] tabular-nums w-10 text-right">
                        {v}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-border">
              {siteKey && (
                <div ref={widgetContainer} className="mb-3 flex justify-center" />
              )}
              {err && (
                <p className="text-red-400 text-xs mb-2 text-center">{err}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded border border-border text-dim hover:border-gold hover:text-gold2 text-sm transition-colors"
                >
                  {L.cancel}
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!selected || submitting}
                  className="flex-1 py-2 rounded border border-gold bg-gold/15 text-gold2 font-bold text-sm uppercase tracking-widest hover:bg-gold/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? L.submitting : L.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
