import { Link } from "@/src/i18n/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";

type Props = {
  locale: string;
  title: string;
  lastUpdated: string;
  breadcrumbLabel: string;
  children: React.ReactNode;
};

/**
 * Shared shell for all legal / compliance pages.
 * Keeps typography, breadcrumbs, and max width consistent across
 * mentions légales, privacy, cookies, terms, about, contact.
 */
export function LegalLayout({ locale, title, lastUpdated, breadcrumbLabel, children }: Props) {
  const homeLabel = locale === "fr" ? "Accueil" : "Home";
  return (
    <>
      <TopBar />
      <div className="max-w-[860px] mx-auto px-6 py-8">
        <div className="text-xs text-muted mb-4">
          <Link href="/" className="text-dim">
            {homeLabel}
          </Link>{" "}
          <span className="mx-2 text-border">›</span>
          <span>{breadcrumbLabel}</span>
        </div>

        <h1 className="text-3xl text-gold2 font-extrabold mb-2">{title}</h1>
        <p className="text-dim text-sm mb-8">{lastUpdated}</p>

        <div className="bg-panel border border-border rounded-lg p-6 space-y-6 text-ink text-sm leading-relaxed legal-prose">
          {children}
        </div>
      </div>
      <Footer />
    </>
  );
}

/** Styled section heading used inside legal pages. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-gold2 font-bold uppercase tracking-widest text-base mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

/** Key:value line for identity / contact blocks. */
export function LegalField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p>
      <span className="text-muted">{label} :</span>{" "}
      <span className="text-ink">{value}</span>
    </p>
  );
}
