import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { legalConfig } from "@/lib/legal-config";
import ManageCookiesLink from "./ManageCookiesLink";
import ReportMistakeLink from "./ReportMistakeLink";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#0a0e13] border-t border-border py-10 px-6 mt-10 text-center text-muted text-sm">
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-3">
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
        <span className="text-border">·</span>
        <ReportMistakeLink className="hover:text-gold2 cursor-pointer underline-offset-2" />
      </nav>
      <p className="text-[11px] text-dim max-w-3xl mx-auto leading-relaxed">
        © {year} {legalConfig.site.name} —{" "}
        {t("footer.unofficialDisclaimer")}
      </p>
    </footer>
  );
}
