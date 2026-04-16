import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { legalConfig } from "@/lib/legal-config";
import ManageCookiesLink from "./ManageCookiesLink";
import ReportMistakeLink from "./ReportMistakeLink";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#0a0e13] border-t border-border py-8 md:py-10 px-6 mt-10 text-center text-muted text-sm">
      {/*
        Report-a-mistake CTA — lifted out of the dense link list and turned
        into a distinct accent button so visitors spot it. Anchored above
        the legal nav so feedback is one click from anywhere on the site.
      */}
      <div className="mb-5 flex justify-center">
        <ReportMistakeLink
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/50 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:border-red-500/70 hover:text-red-100 text-xs md:text-sm font-semibold uppercase tracking-widest cursor-pointer shadow-[0_1px_3px_rgba(200,55,45,0.2)] hover:shadow-[0_2px_8px_rgba(200,55,45,0.35)] transition-all"
          prefixIcon="⚠️"
        />
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
      <p className="text-[11px] text-dim max-w-3xl mx-auto leading-relaxed">
        © {year} {legalConfig.site.name} —{" "}
        {t("footer.unofficialDisclaimer")}
      </p>
    </footer>
  );
}
