import { BASE_URL } from "./seo-alternates";

/**
 * Open Graph image entries for `metadata.openGraph.images` /
 * `metadata.twitter.images`, backed by the branded card generator at
 * app/og/route.tsx.
 *
 * Usage in a page's generateMetadata:
 *
 *   openGraph: {
 *     ...,
 *     images: ogImage({ title: g.name, sub: "World Conqueror 4", img: g.image?.head }),
 *   }
 *
 * IMPORTANT (App Router metadata semantics): `openGraph` from a page
 * REPLACES the layout's `openGraph` wholesale — it does not deep-merge.
 * Any page that defines its own `openGraph` must therefore include
 * `images:` explicitly, or it silently loses the site-wide default card.
 */
export function ogImage(opts: { title: string; sub?: string; img?: string }) {
  const params = new URLSearchParams();
  params.set("title", opts.title.slice(0, 120));
  if (opts.sub) params.set("sub", opts.sub.slice(0, 80));
  // satori (the og renderer) cannot decode webp — only forward png/jpg
  // sprites; webp entities fall back to the text-only branded card.
  if (opts.img && /\.(png|jpe?g)$/i.test(opts.img)) params.set("img", opts.img);
  return [
    {
      url: `${BASE_URL}/og?${params.toString()}`,
      width: 1200,
      height: 630,
      alt: opts.title,
    },
  ];
}

/** Site-wide default card (layout fallback for pages without openGraph). */
export function defaultOgImage(siteTitle: string) {
  return ogImage({ title: siteTitle, sub: "The Strategy Wiki" });
}
