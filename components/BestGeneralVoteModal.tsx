"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Game } from "@/lib/types";

export type GeneralOption = {
  slug: string;
  name: string;
  nameEn?: string;
  portrait?: string | null;
  rank?: string | null;
  country?: string | null;
};

export type VoteResult = {
  counts: Record<string, number>;
  total: number;
};

interface Props {
  game: Game;
  generals: GeneralOption[];
  open: boolean;
  onClose: () => void;
  onVoted: (r: VoteResult) => void;
  /** Preselect a general (used when clicking a placeholder tile). */
  prefillSlug?: string | null;
}

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

function displayName(g: GeneralOption, locale: string): string {
  return locale === "fr" ? g.name : g.nameEn || g.name;
}

export default function BestGeneralVoteModal({
  game,
  generals,
  open,
  onClose,
  onVoted,
  prefillSlug,
}: Props) {
  const t = useTranslations("bestGeneralVote");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const locale =
    typeof document !== "undefined" ? document.documentElement.lang || "fr" : "fr";

  // Reset on open; honor prefill.
  useEffect(() => {
    if (open) {
      setSelectedSlug(prefillSlug ?? null);
      setErrorMsg(null);
      setQuery("");
      setTurnstileToken(null);
    }
  }, [open, prefillSlug]);

  // Turnstile bootstrap.
  useEffect(() => {
    if (!open || !siteKey) return;
    let active = true;
    loadTurnstile().then(() => {
      if (!active || !window.turnstile || !turnstileContainerRef.current) return;
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
  }, [open, siteKey]);

  // Escape to close + lock body scroll.
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
        body: JSON.stringify({ game, general: selectedSlug, turnstileToken }),
      });
      const data = await res.json();
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
      onVoted({ counts: data.counts || {}, total: data.total || 0 });
    } catch {
      setErrorMsg(t("errors.connectionLost"));
    } finally {
      setSubmitting(false);
    }
  }, [game, selectedSlug, siteKey, turnstileToken, onVoted, t]);

  if (!open) return null;

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return generals;
    return generals.filter((g) =>
      (g.name + " " + (g.nameEn || "")).toLowerCase().includes(q)
    );
  })();

  // When a preselection is active, pin that general at the top of the list
  // so the user immediately sees the current pick, and knows where to look
  // if they want to swap. The pinned row is only rendered when prefillSlug
  // matches a general in our list, and is always visible regardless of the
  // current search query.
  const pinned =
    prefillSlug && generals.find((g) => g.slug === prefillSlug);
  const belowList = pinned
    ? filtered.filter((g) => g.slug !== pinned.slug)
    : filtered;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
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
            onClick={onClose}
            className="text-muted hover:text-gold2 text-xl leading-none"
            aria-label={t("modal.close")}
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b border-border space-y-2">
          {pinned && (
            <div className="text-[11px] uppercase tracking-widest text-muted">
              {t("modal.searchHint")}
            </div>
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("modal.searchPlaceholder")}
            className="w-full bg-bg3 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-gold outline-none"
          />
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {pinned && (
            <div className="mb-2">
              <div className="text-[10px] uppercase tracking-widest text-gold2/80 px-1 pb-1">
                {t("modal.prefilledLabel")}
              </div>
              <GeneralRadioRow
                g={pinned}
                checked={selectedSlug === pinned.slug}
                onSelect={() => setSelectedSlug(pinned.slug)}
                locale={locale}
              />
            </div>
          )}
          {belowList.length === 0 && !pinned ? (
            <div className="text-muted text-xs italic text-center py-6">
              {t("modal.noResults")}
            </div>
          ) : (
            <ul className="space-y-1">
              {belowList.map((g) => (
                <li key={g.slug}>
                  <GeneralRadioRow
                    g={g}
                    checked={selectedSlug === g.slug}
                    onSelect={() => setSelectedSlug(g.slug)}
                    locale={locale}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-border space-y-3">
          {siteKey ? (
            <div ref={turnstileContainerRef} className="flex justify-center" />
          ) : (
            <div className="text-muted text-[11px] italic text-center">
              {t("modal.turnstileMissing")}
            </div>
          )}
          {errorMsg && (
            <div className="text-red-300 text-xs text-center">{errorMsg}</div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2 rounded border border-border text-dim text-xs font-bold uppercase tracking-widest hover:border-gold/50"
            >
              {t("modal.cancel")}
            </button>
            <button
              type="button"
              onClick={submit}
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
  );
}

function GeneralRadioRow({
  g,
  checked,
  onSelect,
  locale,
}: {
  g: GeneralOption;
  checked: boolean;
  onSelect: () => void;
  locale: string;
}) {
  return (
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
          onChange={onSelect}
        />
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-bg2 border border-gold/30 shrink-0">
          {g.portrait ? (
            <Image
              src={g.portrait}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : null}
        </div>
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
  );
}
