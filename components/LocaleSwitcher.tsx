"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import { locales, type Locale } from "@/src/i18n/config";
import { useTransition } from "react";

const FLAG: Record<Locale, string> = { fr: "🇫🇷", en: "🇬🇧", de: "🇩🇪" };
const LABEL: Record<Locale, string> = { fr: "Français", en: "English", de: "Deutsch" };

export default function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="flex items-center gap-1 text-sm"
      aria-label={t("localeSwitcher")}
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            disabled={active || isPending}
            onClick={() => {
              startTransition(() => {
                router.replace(pathname, { locale: l });
              });
            }}
            className={
              active
                ? "px-3 py-2 min-h-[40px] rounded bg-gold/20 text-gold2 cursor-default"
                : "px-3 py-2 min-h-[40px] rounded text-dim hover:text-gold2 hover:bg-border/30 transition-colors"
            }
            aria-label={LABEL[l]}
            title={LABEL[l]}
          >
            <span aria-hidden="true">{FLAG[l]}</span> {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
