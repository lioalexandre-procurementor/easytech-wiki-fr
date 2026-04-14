import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="bg-[#0a0e13] border-t border-border py-8 px-6 mt-10 text-center text-muted text-sm">
      <p>
        <a href="#" className="mx-2.5">{t("footer.about")}</a>·
        <a href="#" className="mx-2.5">{t("footer.legal")}</a>·
        <a href="#" className="mx-2.5">{t("footer.gdpr")}</a>·
        <a href="#" className="mx-2.5">{t("footer.contact")}</a>·
        <a href="#" className="mx-2.5">Discord FR</a>
      </p>
      <p className="mt-2.5">© 2026 EasyTech Wiki FR — Wiki non-officiel. World Conqueror 4 est une marque d'EasyTech.</p>
    </footer>
  );
}
