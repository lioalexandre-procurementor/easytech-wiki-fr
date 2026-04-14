"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LearnableSkill } from "@/lib/types";

type VoteApiResponse = {
  counts: Record<string, number>;
  hasVoted: boolean;
  disabled?: boolean;
  error?: string;
};

interface Props {
  generalSlug: string;
  slot: number;                 // 1..5 — the replaceable skill slot
  currentSkillName?: string;    // the default/innate skill name at this slot (for context)
  candidates: LearnableSkill[]; // eligible learnable skills for this general's category
  recommended?: string;         // id of the editorial pick
  recommendationReason?: string;
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

export default function TrainedSkillVote({
  generalSlug,
  slot,
  currentSkillName,
  candidates,
  recommended,
  recommendationReason,
}: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/vote?general=${generalSlug}&slot=${slot}`, {
      cache: "no-store",
    })
      .then((r) => r.json() as Promise<VoteApiResponse>)
      .then((data) => {
        if (cancelled) return;
        setCounts(data.counts || {});
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
  }, [generalSlug, slot]);

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
    setSelectedSkill(recommended || candidates[0]?.id || null);
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
    if (!selectedSkill) return;
    if (siteKey && !turnstileToken) {
      setErrorMsg("Merci de compléter la vérification anti-bot.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: generalSlug,
          slot,
          skill: selectedSkill,
          turnstileToken,
        }),
      });
      const data = (await res.json()) as VoteApiResponse;
      if (!res.ok) {
        setErrorMsg(
          data.error === "already voted"
            ? "Vous avez déjà voté pour ce slot (valable 30 jours)."
            : data.error === "captcha failed"
            ? "Vérification anti-bot échouée. Réessayez."
            : "Erreur lors de l'envoi du vote."
        );
        setSubmitting(false);
        return;
      }
      setCounts(data.counts || {});
      setHasVoted(true);
      setModalOpen(false);
    } catch {
      setErrorMsg("Connexion perdue. Réessayez dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const ranked = candidates
    .map((c) => ({ ...c, votes: counts[c.id] || 0 }))
    .sort((a, b) => b.votes - a.votes);
  const top3 = ranked.slice(0, 3);
  const recommendedCandidate = recommended
    ? candidates.find((c) => c.id === recommended)
    : candidates.find((c) => c.popularMeta) || null;

  return (
    <div
      className="mt-3 border rounded-lg p-4 bg-bg3"
      style={{
        borderColor: "rgba(212,164,74,0.3)",
        minHeight: 280,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gold2 text-[10px] font-extrabold uppercase tracking-widest">
            🎓 Slot entraînable
          </span>
          {currentSkillName && (
            <span className="text-muted text-[10px]">
              Défaut : « {currentSkillName} »
            </span>
          )}
        </div>
      </div>

      {recommendedCandidate && (
        <div className="mb-3 p-2.5 rounded border border-gold/40 bg-gold/10">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-gold2 text-[10px] font-extrabold uppercase tracking-widest shrink-0">
                ⭐ Meta
              </span>
              <span className="text-gold2 font-bold text-sm truncate">
                {recommendedCandidate.name}
              </span>
            </div>
            {recommendedCandidate.rating && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border bg-red-500/20 border-red-500/40 text-red-300 shrink-0">
                {recommendedCandidate.rating}
              </span>
            )}
          </div>
          {(recommendationReason || recommendedCandidate.editorialNote) && (
            <div className="text-dim text-xs italic">
              {recommendationReason || recommendedCandidate.editorialNote}
            </div>
          )}
        </div>
      )}

      <div className="mb-3">
        <div className="text-muted text-[10px] uppercase tracking-widest font-bold mb-2">
          Top 3 votes communauté
        </div>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-6 rounded bg-border/40 animate-pulse"
              />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="text-muted text-xs italic py-2">
            Aucun vote pour l'instant — soyez le premier à voter !
          </div>
        ) : (
          <ul className="space-y-1.5">
            {top3.map((c, i) => {
              const pct = total > 0 ? Math.round((c.votes / total) * 100) : 0;
              const medal = ["🥇", "🥈", "🥉"][i];
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-base w-5 text-center">{medal}</span>
                  <span className="flex-1 text-ink truncate">{c.name}</span>
                  <span className="text-gold2 font-bold text-xs tabular-nums">
                    {c.votes}
                  </span>
                  <span className="text-muted text-[10px] tabular-nums w-10 text-right">
                    ({pct}%)
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!disabled && (
        <>
          {hasVoted ? (
            <div className="text-center text-xs text-gold2 py-2 border border-gold/30 rounded bg-gold/5">
              ✓ Merci — votre vote est compté (valable 30 jours)
            </div>
          ) : (
            <button
              type="button"
              onClick={openVoteModal}
              className="w-full py-2 rounded border border-gold bg-gold/15 text-gold2 text-xs font-extrabold uppercase tracking-widest hover:bg-gold/25 transition-colors"
            >
              🗳 Voter pour votre préférée
            </button>
          )}
          <div className="text-muted text-[10px] text-center mt-2">
            {total} vote{total > 1 ? "s" : ""} au total
          </div>
        </>
      )}
      {disabled && (
        <div className="text-muted text-[11px] italic text-center mt-2">
          Le vote communautaire n'est pas encore actif sur cette fiche.
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
                Slot {slot} — Votre préférence
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-muted hover:text-gold2 text-xl leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {candidates.map((c) => {
                const votes = counts[c.id] || 0;
                const checked = selectedSkill === c.id;
                return (
                  <label
                    key={c.id}
                    className={`block border rounded-lg p-3 cursor-pointer transition-colors ${
                      checked
                        ? "border-gold bg-gold/10"
                        : "border-border bg-bg3 hover:border-gold/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name={`vote-${slot}`}
                        checked={checked}
                        onChange={() => setSelectedSkill(c.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-gold2 font-bold text-sm">
                            {c.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {c.rating && (
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border bg-red-500/20 border-red-500/40 text-red-300">
                                {c.rating}
                              </span>
                            )}
                            <span className="text-muted text-[10px] tabular-nums">
                              {votes} vote{votes > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="text-dim text-xs leading-relaxed">
                          {c.desc}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="p-4 border-t border-border space-y-3">
              {siteKey ? (
                <div
                  ref={turnstileContainerRef}
                  className="flex justify-center"
                />
              ) : (
                <div className="text-muted text-[11px] italic text-center">
                  (Turnstile non configuré — vérification désactivée en dev)
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
                  className="flex-1 py-2 rounded border border-border text-dim text-xs font-bold uppercase tracking-widest hover:border-gold/50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitVote}
                  disabled={submitting || !selectedSkill}
                  className="flex-1 py-2 rounded border border-gold bg-gold/20 text-gold2 text-xs font-extrabold uppercase tracking-widest hover:bg-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Envoi..." : "Confirmer"}
                </button>
              </div>
              <div className="text-muted text-[10px] text-center">
                Vote anonyme, valable 30 jours ·{" "}
                <a href="/legal/votes" className="underline hover:text-gold2">
                  Politique
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
