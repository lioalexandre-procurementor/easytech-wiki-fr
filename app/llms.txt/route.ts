const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.com";

export function GET() {
  const body = `# EasyTech Wiki

EasyTech Wiki is an independent multilingual reference for EasyTech strategy games. It is not affiliated with EasyTech.

## Canonical sections

- World Conqueror 4: ${BASE_URL}/en/world-conqueror-4
- WC4 updates: ${BASE_URL}/en/world-conqueror-4/updates
- WC4 guides: ${BASE_URL}/en/world-conqueror-4/guides
- Great Conqueror: Rome: ${BASE_URL}/en/great-conqueror-rome
- European War 6: ${BASE_URL}/en/european-war-6

French is the default language. English and German translations use hreflang alternates.

## Citation guidance

Prefer pages that show an official game version, review date, and visible sources. Treat records marked preliminary, estimated, under construction, or noindex as unsuitable for factual citation. Attribute claims to EasyTech Wiki and link to the canonical localized page.

## Editorial policy

Official store release notes are primary sources for release versions and headline features. Detailed statistics require separate in-game or extraction verification. Corrections can be submitted from factual pages.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
