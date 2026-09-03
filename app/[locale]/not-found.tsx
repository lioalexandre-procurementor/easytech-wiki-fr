import { getLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { Footer } from "@/components/Footer";
import { TopBar } from "@/components/TopBar";

const copy = {
  fr: { title: "Page introuvable", body: "Cette fiche n'existe pas ou a été retirée pour vérification.", action: "Retour à l'accueil" },
  en: { title: "Page not found", body: "This page does not exist or was removed for verification.", action: "Back to home" },
  de: { title: "Seite nicht gefunden", body: "Diese Seite existiert nicht oder wurde zur Prüfung entfernt.", action: "Zur Startseite" },
} as const;

export default async function NotFound() {
  const locale = (await getLocale()) as keyof typeof copy;
  const text = copy[locale] ?? copy.en;
  return (
    <>
      <TopBar />
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-16 min-h-[60vh]">
        <p className="text-gold uppercase tracking-widest text-xs font-bold mb-3">404</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gold2 mb-3">{text.title}</h1>
        <p className="text-dim mb-7">{text.body}</p>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-md bg-gold px-5 py-2.5 text-bg font-bold no-underline">
          {text.action}
        </Link>
      </main>
      <Footer />
    </>
  );
}
