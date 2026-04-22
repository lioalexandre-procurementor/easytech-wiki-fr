import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { legalConfig } from "@/lib/legal-config";
import ManageCookiesLink from "./ManageCookiesLink";
import ReportMistakeLink from "./ReportMistakeLink";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-bg-deep border-t border-border py-8 md:py-10 px-6 mt-10 text-center text-muted text-sm">
      <div className="mb-5 flex justify-center">
        <ReportMistakeLink
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/50 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:border-red-500/70 hover:text-red-100 text-xs md:text-sm font-semibold uppercase tracking-widest cursor-pointer shadow-[0_1px_3px_rgba(200,55,45,0.2)] hover:shadow-[0_2px_8px_rgba(200,55,45,0.35)] transition-all"
          prefixIcon={<Icon name="warning" size={14} />}
        />
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs md:text-sm">
        <span className="text-dim uppercase tracking-widest text-[10px] md:text-xs">
          {t("footer.followUs")}
        </span>
        <a
          href="https://instagram.com/easytech.wiki"
          target="_blank"
          rel="noopener noreferrer me"
          aria-label="Instagram — @easytech.wiki"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-gold bg-panel hover:bg-gold/5 text-dim hover:text-gold2 font-semibold transition-colors"
        >
          <Icon name="instagram" size={16} />
          <span>@easytech.wiki</span>
        </a>
        <a
          href="https://reddit.com/user/easytechwiki"
          target="_blank"
          rel="noopener noreferrer me"
          aria-label="Reddit — u/easytechwiki"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-gold bg-panel hover:bg-gold/5 text-dim hover:text-gold2 font-semibold transition-colors"
        >
          <Icon name="reddit" size={16} />
          <span>u/easytechwiki</span>
        </a>
      </div>
      <nav className="flex flex-wrap justify-center gap-x-4 md:gap-x-5 gap-y-2 mb-3 text-xs md:text-sm">
        <Link href="/legal/a-propos" className="hover:text-gold2">
          {t("footer.about")}
        </Link>
        <span className="text-border">·</span>
        <Link href="/legal/mentions-legales" className="hover:text-gold2">
          {t("footer.legal")}
        </Link>
        <span className="text-border">·</span>
        <Link href="/legal/confidentialite" className="hover:text-gold2">
          {t("footer.privacy")}
        </Link>
        <span className="text-border">·</span>
        <Link href="/legal/cookies" className="hover:text-gold2">
          {t("footer.cookies")}
        </Link>
        <span className="text-border">·</span>
        <ManageCookiesLink
          label={t("footer.manageCookies")}
          className="hover:text-gold2 cursor-pointer underline-offset-2"
        />
        <span className="text-border">·</span>
        <Link href="/legal/cgu" className="hover:text-gold2">
          {t("footer.terms")}
        </Link>
        <span className="text-border">·</span>
        <Link href="/legal/contact" className="hover:text-gold2">
          {t("footer.contact")}
        </Link>
      </nav>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4 mt-4 max-w-3xl mx-auto">
        <p className="text-[11px] text-muted leading-relaxed text-left flex-1 min-w-0">
          © {year} {legalConfig.site.name} —{" "}
          {t("footer.unofficialDisclaimer")}
        </p>
        <ThemeToggle
          labelDark={t("nav.theme.dark")}
          labelLight={t("nav.theme.light")}
        />
      </div>
    </footer>
  );
}
