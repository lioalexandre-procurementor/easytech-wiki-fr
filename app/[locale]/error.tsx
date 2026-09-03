"use client";

import { useLocale } from "next-intl";
import { Link } from "@/src/i18n/navigation";

const copy = {
  fr: { title: "Cette page n'a pas pu être chargée", body: "Réessayez maintenant ou revenez à l'accueil.", retry: "Réessayer", home: "Accueil" },
  en: { title: "This page could not be loaded", body: "Try again now or return to the homepage.", retry: "Try again", home: "Home" },
  de: { title: "Diese Seite konnte nicht geladen werden", body: "Versuchen Sie es erneut oder kehren Sie zur Startseite zurück.", retry: "Erneut versuchen", home: "Startseite" },
} as const;

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useLocale() as keyof typeof copy;
  const text = copy[locale] ?? copy.en;
  return (
    <main className="max-w-2xl mx-auto px-4 md:px-6 py-16 min-h-[60vh]">
      <p className="text-accent uppercase tracking-widest text-xs font-bold mb-3">Error</p>
      <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-3">{text.title}</h1>
      <p className="text-dim mb-7">{text.body}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="min-h-11 rounded-md bg-gold px-5 py-2.5 text-bg font-bold">
          {text.retry}
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-2.5 text-gold2 font-bold no-underline">
          {text.home}
        </Link>
      </div>
    </main>
  );
}
