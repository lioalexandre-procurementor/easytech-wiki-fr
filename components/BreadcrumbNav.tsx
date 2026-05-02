import { Link } from "@/src/i18n/navigation";
import { JsonLd } from "./JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easytech-wiki.com";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
  locale: string;
  separator?: string;
}

export function BreadcrumbNav({ items, locale, separator = "›" }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}/${locale}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <JsonLd data={schema} />
      <nav
        aria-label="Breadcrumb"
        className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted"
      >
        <ol className="flex items-center flex-wrap gap-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-border mx-1">{separator}</span>}
              {item.href ? (
                <Link href={item.href as any} className="text-dim hover:text-gold2 no-underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
