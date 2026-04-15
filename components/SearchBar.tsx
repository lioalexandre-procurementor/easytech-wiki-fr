"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Fuse from "fuse.js";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";

type SearchItem = {
  type: "general" | "unit" | "skill" | "update";
  slug: string;
  name: string;
  nameFr: string;
  desc?: string;
  descFr?: string;
  category?: string;
  country?: string;
  tier?: string;
  path: { fr: string; en: string };
};

type Payload = { version: number; builtAt: string; items: SearchItem[] };

const TYPE_ICON: Record<SearchItem["type"], string> = {
  general: "👨‍✈️",
  unit: "🏅",
  skill: "⚡",
  update: "📣",
};

export default function SearchBar() {
  const t = useTranslations("search");
  const locale = useLocale() as "fr" | "en";
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fuseRef = useRef<Fuse<SearchItem> | null>(null);

  // Lazy-load the index on first focus.
  const loadIndex = useCallback(async () => {
    if (items || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/search-index.json", { cache: "force-cache" });
      const data = (await res.json()) as Payload;
      setItems(data.items);
      fuseRef.current = new Fuse(data.items, {
        keys: [
          { name: "name", weight: 2 },
          { name: "nameFr", weight: 2 },
          { name: "desc", weight: 0.5 },
          { name: "descFr", weight: 0.5 },
          { name: "category", weight: 0.3 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      });
    } catch (e) {
      console.error("Failed to load search index", e);
    } finally {
      setLoading(false);
    }
  }, [items, loading]);

  const results = useMemo(() => {
    if (!query.trim() || !fuseRef.current) return [];
    return fuseRef.current.search(query, { limit: 12 }).map((r) => r.item);
  }, [query, items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group by type for display.
  const grouped = useMemo(() => {
    const g: Record<SearchItem["type"], SearchItem[]> = {
      general: [],
      unit: [],
      skill: [],
      update: [],
    };
    for (const r of results) g[r.type].push(r);
    return g;
  }, [results]);

  const flat = useMemo(() => [...grouped.general, ...grouped.unit, ...grouped.skill, ...grouped.update], [grouped]);

  // Keyboard: global Cmd/Ctrl + K, plus local arrow keys / Enter / Escape.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        loadIndex();
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const pick = flat[selectedIndex];
        if (pick) {
          setOpen(false);
          setQuery("");
          router.push(pick.path[locale] as any);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, flat, selectedIndex, loadIndex, router, locale]);

  // Click-outside to close.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Reset selection when results change.
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const renderItem = (it: SearchItem, globalIndex: number) => {
    const display = locale === "fr" ? it.nameFr || it.name : it.name || it.nameFr;
    const sub = locale === "fr" ? it.descFr || it.desc : it.desc || it.descFr;
    const href = it.path[locale];
    const active = globalIndex === selectedIndex;
    return (
      <button
        key={`${it.type}-${it.slug}`}
        type="button"
        onMouseEnter={() => setSelectedIndex(globalIndex)}
        onClick={() => {
          setOpen(false);
          setQuery("");
          router.push(href as any);
        }}
        className={`w-full text-left px-3 py-2 rounded flex items-start gap-2 ${
          active ? "bg-gold/10 text-gold2" : "text-dim hover:bg-gold/5"
        }`}
      >
        <span className="text-base">{TYPE_ICON[it.type]}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold truncate">{display}</span>
          {sub && <span className="block text-xs text-muted truncate">{sub}</span>}
        </span>
        {it.tier && (
          <span className="text-[10px] font-bold text-gold2 uppercase tracking-widest">{it.tier}</span>
        )}
      </button>
    );
  };

  let indexCounter = 0;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="flex items-center gap-2 bg-bg3 border border-border rounded-md px-3 py-1.5">
        <span>🔍</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setOpen(true);
            loadIndex();
          }}
          placeholder={t("placeholder")}
          className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted text-ink"
          aria-label={t("placeholder")}
        />
        <kbd className="hidden md:inline text-[10px] text-muted border border-border px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-panel border border-border rounded-md shadow-xl max-h-[70vh] overflow-y-auto z-50">
          {loading && (
            <div className="p-3 text-center text-muted text-xs">{t("loading")}</div>
          )}
          {!loading && flat.length === 0 && (
            <div className="p-4 text-center text-muted text-xs italic">{t("noResults")}</div>
          )}
          {!loading && flat.length > 0 && (
            <div className="p-1">
              {(["general", "unit", "skill", "update"] as const).map((type) => {
                const group = grouped[type];
                if (group.length === 0) return null;
                return (
                  <div key={type} className="mb-1">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                      {t(`group.${type}`)} · {group.length}
                    </div>
                    {group.map((it) => {
                      const node = renderItem(it, indexCounter);
                      indexCounter++;
                      return node;
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
