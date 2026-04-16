"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { generalsHubPath } from "@/lib/games";
import type { Game } from "@/lib/types";

/**
 * Shared "vote for the best general on this elite unit" modal.
 *
 * Used by two surfaces today:
 *   1. `UnitBestGeneralVote` — the widget on a unit detail page.
 *   2. `UnitsByCategory` / `UnitLeaderboardRow` — the new leaderboards
 *      units tab, where one modal instance is lifted to the section
 *      parent and re-used across all rows.
 *
 * Owns:
 *   - the visible modal shell (backdrop, Escape-to-close, body scroll lock)
 *   - the general-selection search + radio list (with portraits)
 *   - Turnstile bootstrap + token capture
 *   - POST /api/vote/unit-general
 *
 * Callers are responsible for:
 *   - deciding when to open it (controlled via `open` + `onClose`)
 *   - passing an optional `prefillGeneralSlug` when the open action came
 *     from clicking a specific general box on a row
 *   - reacting to `onVoted(result)` — typically by updating local
 *     `{counts,total}` state so the caller's UI refreshes in-place.
 */

export type UnitVoteCandidate = {
  slug: string;
  name: string;
  nameEn?: string;
  rank: "S" | "A" | "B" | "C" | null;
  country?: string | null;
  portrait?: string | null;
};

export type UnitVoteResult = {
  counts: Record<string, number>;
  total: number;
};

type VoteApiResponse = {
  counts?: Record<string, number>;
  total?: number;
  hasVoted?: boolean;
  disabled?: boolean;
  error?: string;
};

type Props = {
  game: Game;
  unitSlug: string;
  unitDisplayName: string;
  candidates: UnitVoteCandidate[];
  open: boolean;
  onClose: () => void;
  onVoted: (result: UnitVoteResult) => void;
  /** Preselect a general on open. Pinned to the top of the list and
   *  checked by default so the user can just hit Confirm. */
  prefillGeneralSlug?: string | null;
  /** Skip the open-time GET if the caller already has fresh counts. */
  initialCounts?: Record<string, number>;
  initialTotal?: number;
  initialHasVoted?: boolean;
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

type ModalLabels = {
  title: (name: string) => string;
  intro: string;
  search: string;
  searchHint: string;
  prefilledLabel: string;
  noMatch: string;
  cancel: string;
  confirm: string;
  submitting: string;
  close: string;
  thanks: string;
  loading: string;
  errAlready: string;
  errCaptcha: string;
  errSubmit: string;
  errConnection: string;
  captchaMissing: string;
  turnstileMissing: string;
  openProfile: string;
};

const LABELS: Record<string, ModalLabels> = {
  fr: {
    title: (name) => `Quel général pour ${name} ?`,
    intro:
      "Votez pour le général que vous estimez le plus efficace sur cette unité d'élite. Un vote par visiteur, valable 30 jours.",
    search: "Rechercher un général…",
    searchHint: "Envie d'un autre ? Recherchez-le ci-dessous.",
    prefilledLabel: "Votre sélection",
    noMatch: "Aucun général ne correspond.",
    cancel: "Annuler",
    confirm: "Confirmer",
    submitting: "Envoi…",
    close: "Fermer",
    thanks: "✓ Merci — votre vote est enregistré (valide 30 jours).",
    loading: "Chargement…",
    errAlready: "Vous avez déjà voté pour cette unité.",
    errCaptcha: "La vérification anti-bot a échoué. Réessayez.",
    errSubmit: "Erreur lors de l'envoi du vote.",
    errConnection: "Connexion perdue. Réessayez dans un instant.",
    captchaMissing: "Complétez la vérification anti-bot.",
    turnstileMissing: "(Turnstile non configuré — vérification désactivée en dev)",
    openProfile: "Voir le profil",
  },
  en: {
    title: (name) => `Best general for ${name}?`,
    intro:
      "Vote for the general you think pairs best with this elite unit. One vote per visitor, valid 30 days.",
    search: "Search a general…",
    searchHint: "Want a different one? Search below.",
    prefilledLabel: "Your selection",
    noMatch: "No general matches.",
    cancel: "Cancel",
    confirm: "Confirm",
    submitting: "Submitting…",
    close: "Close",
    thanks: "✓ Thanks — your vote is counted (valid 30 days).",
    loading: "Loading…",
    errAlready: "You have already voted for this unit.",
    errCaptcha: "Anti-bot check failed. Please try again.",
    errSubmit: "Error submitting your vote.",
    errConnection: "Connection lost. Please retry in a moment.",
    captchaMissing: "Please complete the anti-bot check.",
    turnstileMissing: "(Turnstile not configured — verification disabled in dev)",
    openProfile: "View profile",
  },
  de: {
    title: (name) => `Welcher General für ${name}?`,
    intro:
      "Stimme für den General, der deiner Meinung nach am besten zu dieser Elite-Einheit passt. Eine Stimme pro Besucher, 30 Tage gültig.",
    search: "General suchen…",
    searchHint: "Jemand anderen im Kopf? Such unten.",
    prefilledLabel: "Deine Auswahl",
    noMatch: "Kein General entspricht.",
    cancel: "Abbrechen",
    confirm: "Bestätigen",
    submitting: "Wird übermittelt…",
    close: "Schließen",
    thanks: "✓ Danke — deine Stimme wurde gezählt (30 Tage gültig).",
    loading: "Lädt…",
    errAlready: "Du hast für diese Einheit bereits abgestimmt.",
    errCaptcha: "Anti-Bot-Prüfung fehlgeschlagen. Bitte erneut versuchen.",
    errSubmit: "Fehler beim Übermitteln der Stimme.",
    errConnection: "Verbindung verloren. Bitte gleich erneut versuchen.",
    captchaMissing: "Bitte schließe die Anti-Bot-Prüfung ab.",
    turnstileMissing: "(Turnstile nicht konfiguriert — Prüfung im Dev deaktiviert)",
    openProfile: "Profil öffnen",
  },
};

const RANK_COLOR: Record<string, string> = {
  S: "bg-red-500/20 border-red-500/40 text-red-300",
  A: "bg-gold/20 border-gold/40 text-gold2",
  B: "bg-blue-500/15 border-blue-500/40 text-blue-300",
  C: "bg-border text-dim",
};

function displayName(c: UnitVoteCandidate, locale: string): string {
  return locale === "fr" ? c.name : c.nameEn || c.name;
}

export default function UnitVoteModal({
  game,
  unitSlug,
  unitDisplayName,
  candidates,
  open,
  onClose,
  onVoted,
  prefillGeneralSlug,
  initialCounts,
  initialTotal,
  initialHasVoted,
}: Props) {
  const locale = useLocale();
  const L = LABELS[locale] ?? LABELS.en;

  const [counts, setCounts] = useState<Record<string, number>>(
    initialCounts ?? {}
  );
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [hasVoted, setHasVoted] = useState(Boolean(initialHasVoted));
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(!initialCounts);
  const [selected, setSelected] = useState<string | null>(
    prefillGeneralSlug ?? null
  );
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const widgetContainer = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  // Reset transient state on each open. When the caller passes fresh
  // initialCounts we skip the fetch; otherwise we fetch on open so the
  // modal always has current state before the user confirms.
  useEffect(() => {
    if (!open) return;
    setSelected(prefillGeneralSlug ?? null);
    setQuery("");
    setErr(null);
    setTurnstileToken(null);
    if (initialCounts) {
      setCounts(initialCounts);
      setTotal(initialTotal ?? 0);
      setHasVoted(Boolean(initialHasVoted));
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/vote/unit-general?game=${game}&unit=${encodeURIComponent(unitSlug)}`,
      { cache: "no-store" }
    )
      .then((r) => r.json() as Promise<VoteApiResponse>)
      .then((d) => {
        if (cancelled) return;
        setCounts(d.counts ?? {});
        setTotal(d.total ?? 0);
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
    // We deliberately re-run whenever the caller opens the modal for a
    // (possibly new) unit. prefillGeneralSlug change mid-open is also a
    // reset trigger.
  }, [open, game, unitSlug, prefillGeneralSlug, initialCounts, initialTotal, initialHasVoted]);

  // Bootstrap Turnstile once the modal is visible. Reset the widget on
  // subsequent opens so a fresh token is issued per vote attempt.
  useEffect(() => {
    if (!open || disabled || hasVoted || !siteKey) return;
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
  }, [open, disabled, hasVoted, siteKey]);

  // Escape-to-close + body-scroll-lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

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
          game,
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
      setCounts(data.counts ?? {});
      setTotal(data.total ?? 0);
      setHasVoted(true);
      onVoted({ counts: data.counts ?? {}, total: data.total ?? 0 });
    } catch {
      setErr(L.errConnection);
    } finally {
      setSubmitting(false);
    }
  }, [selected, siteKey, turnstileToken, game, unitSlug, onVoted, L]);

  if (!open) return null;

  const query_ = query.trim().toLowerCase();
  const filtered = !query_
    ? candidates
    : candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(query_) ||
          (c.nameEn ?? "").toLowerCase().includes(query_) ||
          c.slug.toLowerCase().includes(query_)
      );

  const pinned =
    prefillGeneralSlug && candidates.find((c) => c.slug === prefillGeneralSlug);
  const belowList = pinned
    ? filtered.filter((c) => c.slug !== pinned.slug)
    : filtered;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={L.title(unitDisplayName)}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border rounded-lg w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-gold2 font-bold uppercase tracking-widest text-sm leading-snug">
            {L.title(unitDisplayName)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-gold2 text-xl leading-none w-8 h-8 shrink-0"
            aria-label={L.close}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted text-xs">{L.loading}</div>
        ) : disabled ? (
          <div className="p-8 text-center text-muted text-xs italic">
            {L.errConnection}
          </div>
        ) : hasVoted ? (
          <div className="p-8 text-center text-gold2 text-sm">{L.thanks}</div>
        ) : (
          <>
            <div className="p-4 border-b border-border space-y-2">
              <p className="text-dim text-xs leading-relaxed">{L.intro}</p>
              {pinned && (
                <div className="text-[11px] uppercase tracking-widest text-muted">
                  {L.searchHint}
                </div>
              )}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={L.search}
                className="w-full bg-bg3 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-gold"
              />
            </div>

            <div className="overflow-y-auto p-3 space-y-1 flex-1">
              {pinned && (
                <div className="mb-2">
                  <div className="text-[10px] uppercase tracking-widest text-gold2/80 px-1 pb-1">
                    {L.prefilledLabel}
                  </div>
                  <CandidateRadioRow
                    c={pinned}
                    checked={selected === pinned.slug}
                    onSelect={() => setSelected(pinned.slug)}
                    votes={counts[pinned.slug] ?? 0}
                    locale={locale}
                    game={game}
                    openProfileLabel={L.openProfile}
                  />
                </div>
              )}
              {belowList.length === 0 && !pinned ? (
                <p className="text-muted text-xs italic py-4 text-center">
                  {L.noMatch}
                </p>
              ) : (
                belowList.map((c) => (
                  <CandidateRadioRow
                    key={c.slug}
                    c={c}
                    checked={selected === c.slug}
                    onSelect={() => setSelected(c.slug)}
                    votes={counts[c.slug] ?? 0}
                    locale={locale}
                    game={game}
                    openProfileLabel={L.openProfile}
                  />
                ))
              )}
            </div>

            <div className="p-4 border-t border-border">
              {siteKey ? (
                <div ref={widgetContainer} className="mb-3 flex justify-center" />
              ) : (
                <div className="text-muted text-[11px] italic text-center mb-3">
                  {L.turnstileMissing}
                </div>
              )}
              {err && (
                <p className="text-red-400 text-xs mb-2 text-center">{err}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
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
          </>
        )}
      </div>
    </div>
  );
}

function CandidateRadioRow({
  c,
  checked,
  onSelect,
  votes,
  locale,
  game,
  openProfileLabel,
}: {
  c: UnitVoteCandidate;
  checked: boolean;
  onSelect: () => void;
  votes: number;
  locale: string;
  game: Game;
  openProfileLabel: string;
}) {
  const profileHref = `/${locale}${generalsHubPath(game)}/${c.slug}`;
  return (
    <label
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
        onChange={onSelect}
        className="accent-gold"
      />
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-bg2 border border-gold/30 shrink-0">
        {c.portrait ? (
          <Image
            src={c.portrait}
            alt=""
            fill
            sizes="32px"
            className="object-cover"
          />
        ) : null}
      </div>
      <span className="flex-1 text-sm text-ink truncate">
        {displayName(c, locale)}
      </span>
      {c.rank && (
        <span
          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${RANK_COLOR[c.rank] ?? RANK_COLOR.C}`}
        >
          {c.rank}
        </span>
      )}
      <span className="text-muted text-[11px] tabular-nums w-10 text-right">
        {votes}
      </span>
      <a
        href={profileHref}
        target="_blank"
        rel="noopener noreferrer"
        title={openProfileLabel}
        aria-label={openProfileLabel}
        className="text-muted hover:text-gold2 transition-colors shrink-0 no-underline"
        onClick={(e) => e.stopPropagation()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
        </svg>
      </a>
    </label>
  );
}
