"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

type Labels = {
  triggerLabel: string;
  heading: string;
  intro: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  pageLabel: string;
  cancel: string;
  submit: string;
  submitting: string;
  thanks: string;
  close: string;
  turnstileMissing: string;
  errorTooShort: string;
  errorCaptcha: string;
  errorRateLimited: string;
  errorGeneric: string;
  privacyNote: string;
};

const LABELS: Record<string, Labels> = {
  fr: {
    triggerLabel: "🐞 Signaler une erreur",
    heading: "Signaler une erreur",
    intro:
      "Une statistique fausse, une traduction bizarre, une image cassée ? Dites-nous ce qui cloche et nous corrigerons.",
    descriptionLabel: "Description de l'erreur",
    descriptionPlaceholder:
      "Ex. : sur la fiche de Rokossovsky, l'attribut Armor dit 4 mais le jeu affiche 5.",
    emailLabel: "Votre email (optionnel)",
    emailPlaceholder: "pour vous répondre si besoin",
    pageLabel: "Page concernée",
    cancel: "Annuler",
    submit: "Envoyer le signalement",
    submitting: "Envoi...",
    thanks: "✓ Merci — votre signalement a été enregistré. Nous le traiterons bientôt.",
    close: "Fermer",
    turnstileMissing: "(Turnstile non configuré — vérification désactivée en dev)",
    errorTooShort: "La description doit faire au moins 10 caractères.",
    errorCaptcha: "Vérification anti-bot échouée. Réessayez.",
    errorRateLimited: "Vous venez d'envoyer un signalement. Merci de patienter une minute.",
    errorGeneric: "Erreur lors de l'envoi. Réessayez dans un instant.",
    privacyNote:
      "Signalement anonyme par défaut. L'email n'est utilisé que pour vous répondre et n'est pas partagé.",
  },
  en: {
    triggerLabel: "🐞 Report a mistake",
    heading: "Report a mistake",
    intro:
      "Wrong stat, bad translation, broken image? Tell us what's off and we'll fix it.",
    descriptionLabel: "What's wrong?",
    descriptionPlaceholder:
      "E.g. on the Rokossovsky page, the Armor attribute says 4 but the game shows 5.",
    emailLabel: "Your email (optional)",
    emailPlaceholder: "so we can reply if needed",
    pageLabel: "Page",
    cancel: "Cancel",
    submit: "Submit report",
    submitting: "Submitting...",
    thanks: "✓ Thanks — your report is recorded. We'll look at it soon.",
    close: "Close",
    turnstileMissing: "(Turnstile not configured — verification disabled in dev)",
    errorTooShort: "Description must be at least 10 characters.",
    errorCaptcha: "Anti-bot verification failed. Please try again.",
    errorRateLimited: "You just submitted a report. Please wait a minute.",
    errorGeneric: "Error submitting. Please try again in a moment.",
    privacyNote:
      "Anonymous report by default. Your email is only used to reply if needed and is never shared.",
  },
  de: {
    triggerLabel: "🐞 Fehler melden",
    heading: "Fehler melden",
    intro:
      "Falsche Werte, seltsame Übersetzung, kaputtes Bild? Sag uns, was nicht stimmt, und wir bessern es aus.",
    descriptionLabel: "Was ist falsch?",
    descriptionPlaceholder:
      "Z. B. Auf der Seite von Rokossovsky steht Armor 4, im Spiel aber 5.",
    emailLabel: "Deine E-Mail (optional)",
    emailPlaceholder: "für eine eventuelle Antwort",
    pageLabel: "Seite",
    cancel: "Abbrechen",
    submit: "Meldung abschicken",
    submitting: "Wird gesendet...",
    thanks: "✓ Danke — deine Meldung ist gespeichert. Wir schauen sie uns bald an.",
    close: "Schließen",
    turnstileMissing: "(Turnstile nicht konfiguriert — Verifizierung im Dev-Modus deaktiviert)",
    errorTooShort: "Die Beschreibung muss mindestens 10 Zeichen lang sein.",
    errorCaptcha: "Anti-Bot-Verifizierung fehlgeschlagen. Bitte erneut versuchen.",
    errorRateLimited: "Du hast gerade eine Meldung gesendet. Bitte eine Minute warten.",
    errorGeneric: "Fehler beim Senden. Bitte gleich erneut versuchen.",
    privacyNote:
      "Meldung standardmäßig anonym. Die E-Mail wird nur für eine eventuelle Antwort verwendet und niemals weitergegeben.",
  },
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

export default function ReportMistakeLink({ className }: { className?: string }) {
  const locale = useLocale();
  const L = LABELS[locale] ?? LABELS.en;
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  useEffect(() => {
    if (!open) return;
    if (typeof window !== "undefined") {
      setPageUrl(window.location.href);
      setPageTitle(document.title);
    }
  }, [open]);

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

  const close = useCallback(() => {
    setOpen(false);
    setSubmitted(false);
    setErrorMsg(null);
    setDescription("");
    setEmail("");
    setTurnstileToken(null);
    if (turnstileWidgetId.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId.current);
    }
  }, []);

  const submit = async () => {
    if (description.trim().length < 10) {
      setErrorMsg(L.errorTooShort);
      return;
    }
    if (siteKey && !turnstileToken) {
      setErrorMsg(L.errorCaptcha);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          email,
          pageUrl,
          pageTitle,
          locale,
          turnstileToken,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrorMsg(
          data.error === "rate limited"
            ? L.errorRateLimited
            : data.error === "captcha failed"
            ? L.errorCaptcha
            : data.error === "description too short"
            ? L.errorTooShort
            : L.errorGeneric
        );
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setErrorMsg(L.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "hover:text-gold2 cursor-pointer"}
      >
        {L.triggerLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 p-4"
          onClick={close}
        >
          <div
            className="bg-panel border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-sm">
                {L.heading}
              </h3>
              <button
                type="button"
                onClick={close}
                className="text-muted hover:text-gold2 text-xl leading-none"
                aria-label={L.close}
              >
                ×
              </button>
            </div>

            {submitted ? (
              <div className="p-6 text-center space-y-4">
                <div className="text-gold2 text-sm">{L.thanks}</div>
                <button
                  type="button"
                  onClick={close}
                  className="min-h-[44px] px-4 py-2 rounded border border-gold bg-gold/20 text-gold2 text-xs font-extrabold uppercase tracking-widest hover:bg-gold/30"
                >
                  {L.close}
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                  <p className="text-dim text-sm">{L.intro}</p>
                  <div>
                    <label className="block text-muted text-[10px] uppercase tracking-widest font-bold mb-1">
                      {L.pageLabel}
                    </label>
                    <div className="text-dim text-xs break-all bg-bg3 border border-border rounded px-2 py-1.5">
                      {pageUrl || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-muted text-[10px] uppercase tracking-widest font-bold mb-1">
                      {L.descriptionLabel}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={L.descriptionPlaceholder}
                      rows={5}
                      className="w-full bg-bg3 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-gold outline-none resize-y"
                      maxLength={2000}
                    />
                  </div>
                  <div>
                    <label className="block text-muted text-[10px] uppercase tracking-widest font-bold mb-1">
                      {L.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={L.emailPlaceholder}
                      className="w-full bg-bg3 border border-border rounded px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-gold outline-none"
                      maxLength={120}
                    />
                  </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                  {siteKey ? (
                    <div ref={turnstileContainerRef} className="flex justify-center" />
                  ) : (
                    <div className="text-muted text-[11px] italic text-center">
                      {L.turnstileMissing}
                    </div>
                  )}
                  {errorMsg && (
                    <div className="text-red-300 text-xs text-center">{errorMsg}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={close}
                      className="flex-1 min-h-[44px] py-2 rounded border border-border text-dim text-xs font-bold uppercase tracking-widest hover:border-gold/50"
                    >
                      {L.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting || description.trim().length < 10}
                      className="flex-1 min-h-[44px] py-2 rounded border border-gold bg-gold/20 text-gold2 text-xs font-extrabold uppercase tracking-widest hover:bg-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? L.submitting : L.submit}
                    </button>
                  </div>
                  <div className="text-muted text-[10px] text-center">{L.privacyNote}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
