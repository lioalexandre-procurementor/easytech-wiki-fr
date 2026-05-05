import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 301 redirects for old skill slugs that no longer exist in the data.
  // See SEO-remediation-plan-2026-05-05 (Bucket B) for context — these URLs
  // were emitted before a slug refactor and currently 404 in GSC. Each
  // redirect points to the WC4 skills hub so the link equity is recovered
  // and the URL drops out of the indexing-issue report on next crawl.
  async redirects() {
    const wc4SkillsHub = (locale) =>
      locale === "fr"
        ? `/${locale}/world-conqueror-4/competences`
        : `/${locale}/world-conqueror-4/skills`;

    const wc4Skill = (locale) =>
      locale === "fr"
        ? `/${locale}/world-conqueror-4/competences`
        : `/${locale}/world-conqueror-4/skills`;

    const deadSkillSlugs = ["line-of-battle", "ambush", "position", "2", "3"];

    /** @type {Array<{source: string, destination: string, permanent: boolean}>} */
    const redirects = [];

    for (const locale of ["fr", "en", "de"]) {
      const segment = locale === "fr" ? "competences" : "skills";
      for (const slug of deadSkillSlugs) {
        redirects.push({
          source: `/${locale}/world-conqueror-4/${segment}/${slug}`,
          destination: wc4SkillsHub(locale),
          permanent: true,
        });
      }
    }

    return redirects;
  },
};

export default withNextIntl(nextConfig);
