"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type VoteApiResponse = {
  counts: Record<string, number>;
  total: number;
  hasVoted: boolean;
  disabled?: boolean;
  error?: string;
};

type GeneralOption = {
  slug: string;
  name: string;
  nameEn?: string;
  portrait?: string | null;
  rank?: string | null;
  quality?: string | null;
  country?: string | null;
};

interface Props {
  generals: GeneralOption[];
  placeholderTop5: string[];
  placeholderThreshold?: number;
}

const DEFAULT_THRESHOLD = 300;

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

function loadTurnstileScript(): Promise<void> {
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

function displayName(g: GeneralOption, locale: string): string {
  return locale === "fr" ? g.name : g.nameEn || g.name;
}

export default function BestGeneralVote({
  generals,
  placeholderTop5,
  placeholderThreshold = DEFAULT_THRESHOLD,
}: Props) {
  const t = useTranslations("bestGeneralVote");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  // Best-effort locale detection without pulling useLocale() just for a display label.
  const locale =
    typeof document !== "undefined"
      ? document.documentElement.lang || "fr"
      : "fr";

  const generalBySlug = useMemo(() => {
    const map = new Map<string, GeneralOption>();
    for (const g of generals) map.set(g.slug, g);
    return map;
  }, [generals]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/vote/best-general", { cache: "no-store" })
      .then((r) => r.json() as Promise<VoteApiResponse>)
      .then((data) => {
        if (cancelled) return;
        setCounts(data.counts || {});
        setTotal(data.total || 0);
        setHasVoted(Boolean(data.hasVoted));
        setDisabled(Boolean(data.disabled));
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
  }, []);

  useEffect(() => {
    if (!modalOpen || disabled || !siteKey) return;
    let active = true;
    loadTurnstileScript().then(() => {
      if (!active || !window.turnstile || !turnstileContainerRef.current)
        return;
      if (turnstileWidgetId.current) {
        window.turnstile.reset(turnstileWidgetId.current);
        return;
      }
      const id = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token) => setTurnstileToken(token),
        "error-callback": () => setTurnstileToken(null),
        "expired-callback": () => setTurnstileToken(null),
      });
      turnstileWidgetId.current = id;
    });
    return () => {
      active = false;
    };
  }, [modalOpen, disabled, siteKey]);

  const openVoteModal = () => {
    setQuery("");
    setSelectedSlug(null);
    setErrorMsg(null);
    setTurnstileToken(null);
    setModalOpen(true);
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setErrorMsg(null);
    if (turnstileWidgetId.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId.current);
    }
    setTurnstileToken(null);
  }, []);

  const submitVote = async () => {
    if (!selectedSlug) return;
    if (siteKey && !turnstileToken) {
      setErrorMsg(t("errors.captchaMissing"));
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/vote/best-general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: selectedSlug,
          turnstileToken,
        }),
      });
      const data = (await res.json()) as VoteApiResponse;
      if (!res.ok) {
        setErrorMsg(
          data.error === "already voted"
            ? t("errors.alreadyVoted")
            : data.error === "captcha failed"
            ? t("errors.captchaFailed")
            : t("errors.submitFailed")
        );
        setSubmitting(false);
        return;
      }
      setCounts(data.counts || {});
      setTotal(data.total || 0);
      setHasVoted(true);
      setModalOpen(false);
    } catch {
      setErrorMsg(t("errors.connectionLost"));
    } finally {
      setSubmitting(false);
    }
  };

  const showPlaceholder = total < placeholderThreshold;

  const rankedReal = useMemo(() => {
    const entries = Object.entries(counts)
      .filter(([slug]) => generalBySlug.has(slug))
      .map(([slug, votes]) => ({ slug, votes, general: generalBySlug.get(slug)! }))
      .sort((a, b) => b.votes - a.votes);
    return entries.slice(0, 5);
  }, [counts, generalBySlug]);

  const placeholderResolved = useMemo(
    () =>
      placeholderTop5
        .map((slug) => generalBySlug.get(slug))
        .filter((g): g is GeneralOption => Boolean(g))
        .map((g) => ({ slug: g.slug, votes: 0, general: g })),
    [placeholderTop5, generalBySlug]
  );

  const ranked = showPlaceholder ? placeholderResolved : rankedReal;

  const filteredGenerals = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return generals;
    return generals.filter((g) => {
      const name = (g.name + " " + (g.nameEn || "")).toLowerCase();
      return name.includes(q);
    });
  }, [generals, query]);

  return (
    <div
      id="best-general-vote"
      className="scroll-mt-20 border rounded-lg p-5 bg-panel"
      style={{ borderColor: "rgba(212,164,74,0.35)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-gold2 text-lg font-extrabold uppercase tracking-wide">
            {t("heading")}
          </h3>
          <p className="text-dim text-sm mt-1 max-w-2xl">{t("tagline")}</p>
        </div>
        {!disabled && !hasVoted && (
          <button
            type="button"
            onClick={openVoteModal}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-gold text-[#0a0e13] text-sm font-extrabold uppercase tracking-widest hover:bg-gold2 transition-colors shrink-0"
          >
            {t("voteCta")}
          </button>
        )}
        {hasVoted && (
          <div className="min-h-[44px] flex items-center text-xs text-gold2 px-4 py-2 border border-gold/30 rounded-lg bg-gold/5 shrink-0">
            {t("thanksVoted")}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3 items-end">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${
                i === 1 ? "h-44" : i === 0 ? "h-40" : "h-36"
              } rounded bg-border/30 animate-pulse`}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Podium: ranks 1-3 */}
          <div className="grid grid-cols-3 gap-3 mb-3 items-end">
            {[1, 2, 0].map((visualIdx) => {
              // Podium visual order: silver - gold - bronze (2,1,3)
              const entry = ranked[visualIdx];
              if (!entry) {
                return <div key={visualIdx} className="h-40" />;
              }
              const medal = ["🥇", "🥈", "🥉"][visualIdx];
              const height =
                visualIdx === 0 ? "h-44" : visualIdx === 1 ? "h-40" : "h-36";
              const imgSize =
                visualIdx === 0 ? "w-20 h-20" : "w-16 h-16";
              const imgSizeAttr = visualIdx === 0 ? "80px" : "64px";
              const ringStyle =
                visualIdx === 0
                  ? {
                      boxShadow:
                        "0 0 0 2px rgba(212,164,74,0.9), 0 0 18px rgba(212,164,74,0.35)",
                    }
                  : visualIdx === 1
                  ? { boxShadow: "0 0 0 2px rgba(203,213,225,0.7)" }
                  : { boxShadow: "0 0 0 2px rgba(180,120,60,0.7)" };
              const displayLabel = displayName(entry.general, locale);
              return (
                <div
                  key={entry.slug}
                  className={`${height} rounded-lg border border-border bg-bg3 px-2 py-3 flex flex-col items-center justify-between text-center`}
                  style={
                    visualIdx === 0
                      ? {
                          borderColor: "rgba(212,164,74,0.6)",
                          background: "rgba(212,164,74,0.1)",
                        }
                      : undefined
                  }
                >
                  <div
                    className={`relative ${imgSize} rounded-full overflow-hidden bg-bg2`}
                    style={ringStyle}
                  >
                    {entry.general.portrait ? (
                      <Image
                        src={entry.general.portrait}
                        alt={displayLabel}
                        fill
                        sizes={imgSizeAttr}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-2xl">
                        {medal}
                      </div>
                    )}
                    <span
                      className="absolute -bottom-1 -right-1 text-lg leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                      aria-hidden
                    >
                      {medal}
                    </span>
                  </div>
                  <div className="text-gold2 font-bold text-xs leading-tight line-clamp-2 w-full">
                    {displayLabel}
                  </div>
                  <div className="text-muted text-[10px] tabular-nums">
                    {showPlaceholder
                      ? t("placeholderBadge")
                      : t("voteCount", { count: entry.votes })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranks 4-5 */}
          {ranked.length > 3 && (
            <ul className="space-y-1.5 mb-3">
              {ranked.slice(3, 5).map((entry, i) => {
                const label = displayName(entry.general, locale);
                return (
                  <li
                    key={entry.slug}
                    className="flex items-center gap-2.5 text-sm border border-border rounded px-3 py-1.5 bg-bg3"
                  >
                    <span className="text-muted text-xs font-bold w-6 text-center tabular-nums shrink-0">
                      #{i + 4}
                    </span>
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-bg2 border border-gold/30 shrink-0">
                      {entry.general.portrait ? (
                        <Image
                          src={entry.general.portrait}
                          alt={label}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <span className="flex-1 text-ink truncate">{label}</span>
                    <span className="text-muted text-[10px] tabular-nums">
                      {showPlaceholder
                        ? t("placeholderBadge")
                        : t("voteCount", { count: entry.votes })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="text-muted text-[11px] text-center">
            {showPlaceholder
              ? t("placeholderFooter", { threshold: placeholderThreshold, total })
              : t("totalVotes", { total })}
          </div>
        </>
      )}

      {disabled && (
        <div className="text-muted text-[11px] italic text-center mt-3">
          {t("notActiveYet")}
        </div>
      )}

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-panel border border-border rounded-lg w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-sm">
                {t("modal.title")}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-muted hover:text-gold2 text-xl leading-none"
                aria-label={t("modal.close")}
              >
                ×
              </button>
            </div>

            <div className="p-4 border-b border-border">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("modal.searchPlaceholder")}
                className="w-full bg-bg3 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-gold outline-none"
              />
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {filteredGenerals.length === 0 ? (
                <div className="text-muted text-xs italic text-center py-6">
                  {t("modal.noResults")}
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredGenerals.map((g) => {
                    const checked = selectedSlug === g.slug;
                    return (
                      <li key={g.slug}>
                        <label
                          className={`block border rounded px-3 py-2 cursor-pointer transition-colors ${
                            checked
                              ? "border-gold bg-gold/10"
                              : "border-border bg-bg3 hover:border-gold/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="best-general"
                              checked={checked}
                              onChange={() => setSelectedSlug(g.slug)}
                            />
                            <span className="flex-1 min-w-0 text-sm text-gold2 font-bold truncate">
                              {displayName(g, locale)}
                            </span>
                            {g.rank && (
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border bg-red-500/20 border-red-500/40 text-red-300 shrink-0">
                                {g.rank}
                              </span>
                            )}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="p-4 border-t border-border space-y-3">
              {siteKey ? (
                <div
                  ref={turnstileContainerRef}
                  className="flex justify-center"
                />
              ) : (
                <div className="text-muted text-[11px] italic text-center">
                  {t("modal.turnstileMissing")}
                </div>
              )}
              {errorMsg && (
                <div className="text-red-300 text-xs text-center">
                  {errorMsg}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 min-h-[44px] py-2 rounded border border-border text-dim text-xs font-bold uppercase tracking-widest hover:border-gold/50"
                >
                  {t("modal.cancel")}
                </button>
                <button
                  type="button"
                  onClick={submitVote}
                  disabled={submitting || !selectedSlug}
                  className="flex-1 min-h-[44px] py-2 rounded border border-gold bg-gold/20 text-gold2 text-xs font-extrabold uppercase tracking-widest hover:bg-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t("modal.submitting") : t("modal.confirm")}
                </button>
              </div>
              <div className="text-muted text-[10px] text-center">
                {t("modal.anonymousNote")}
                <a href="/legal/votes" className="underline hover:text-gold2">
                  {t("modal.policyLink")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
