"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { Perk, UnitData } from "@/lib/types";
import { localizedField } from "@/lib/localized-copy";
import { StickyLevelBar, type LevelBarLabels } from "@/components/elite/StickyLevelBar";

const MILESTONES = [5, 9, 12];

type UILabels = {
  statsTitle: string;
  attack: string;
  defense: string;
  hp: string;
  movement: string;
  range: string;
  activeLoadout: string;
  level: string;
  skillCount: (n: number) => string;
  noneUnlocked: string;
  maxLevel: string;
  veteran: string;
  experienced: string;
  trained: string;
  novice: string;
  loadoutHint: string;
  chronHeading: string;
  chronBody: string;
  newBadge: string;
  hint: string;
  prevAria: string;
  nextAria: string;
  levelAria: (n: number) => string;
  totalAt: string;
};

const LABELS: Record<string, UILabels> = {
  fr: {
    statsTitle: "Statistiques — Niveau",
    attack: "Attaque",
    defense: "Défense",
    hp: "HP",
    movement: "Mouvement",
    range: "Portée",
    activeLoadout: "🎯 Loadout actif",
    level: "Niveau",
    skillCount: (n) => `${n} compétence${n > 1 ? "s" : ""}`,
    noneUnlocked: "Aucune compétence débloquée à ce niveau.",
    maxLevel: "Niveau maximum",
    veteran: "Vétéran",
    experienced: "Expérimenté",
    trained: "Formé",
    novice: "Débutant",
    loadoutHint:
      "💡 État réel de l'unité au niveau sélectionné. Les compétences remplacées par une version supérieure sont masquées.",
    chronHeading: "📜 Historique complet des perks",
    chronBody:
      "Cliquez sur un point pour positionner le slider à ce niveau. Inclut les versions remplacées.",
    newBadge: "✨ Nouveau",
    hint: "💡 Cliquez sur un niveau ou utilisez les flèches ←→ du clavier",
    prevAria: "Niveau précédent",
    nextAria: "Niveau suivant",
    levelAria: (n) => `Niveau ${n}`,
    totalAt: "au total",
  },
  en: {
    statsTitle: "Stats — Level",
    attack: "Attack",
    defense: "Defense",
    hp: "HP",
    movement: "Movement",
    range: "Range",
    activeLoadout: "🎯 Active loadout",
    level: "Level",
    skillCount: (n) => `${n} skill${n > 1 ? "s" : ""}`,
    noneUnlocked: "No skills unlocked at this level.",
    maxLevel: "Max level",
    veteran: "Veteran",
    experienced: "Experienced",
    trained: "Trained",
    novice: "Novice",
    loadoutHint:
      "💡 The unit's actual state at the selected level. Perks superseded by a higher version are hidden.",
    chronHeading: "📜 Full perk history",
    chronBody:
      "Tap any dot to jump the slider to that level. Includes superseded versions.",
    newBadge: "✨ New",
    hint: "💡 Click a level or use the ←→ arrow keys",
    prevAria: "Previous level",
    nextAria: "Next level",
    levelAria: (n) => `Level ${n}`,
    totalAt: "total",
  },
  de: {
    statsTitle: "Werte — Stufe",
    attack: "Angriff",
    defense: "Verteidigung",
    hp: "HP",
    movement: "Bewegung",
    range: "Reichweite",
    activeLoadout: "🎯 Aktive Ausrüstung",
    level: "Stufe",
    skillCount: (n) => `${n} ${n > 1 ? "Fähigkeiten" : "Fähigkeit"}`,
    noneUnlocked: "Auf dieser Stufe sind keine Fähigkeiten freigeschaltet.",
    maxLevel: "Maximalstufe",
    veteran: "Veteran",
    experienced: "Erfahren",
    trained: "Ausgebildet",
    novice: "Anfänger",
    loadoutHint:
      "💡 Tatsächlicher Zustand der Einheit auf der gewählten Stufe. Ersetzte Fähigkeiten werden ausgeblendet.",
    chronHeading: "📜 Vollständige Boni-Historie",
    chronBody:
      "Tippe einen Punkt an, um den Slider auf diese Stufe zu setzen. Beinhaltet überholte Versionen.",
    newBadge: "✨ Neu",
    hint: "💡 Klicke auf eine Stufe oder verwende die Pfeiltasten ←→",
    prevAria: "Vorherige Stufe",
    nextAria: "Nächste Stufe",
    levelAria: (n) => `Stufe ${n}`,
    totalAt: "insgesamt",
  },
};

/**
 * Strip a perk name of the trailing " Niv.N" / " Lv.N" / " Lvl.N" token that
 * indicates it's an upgrade of a previous perk. Used to group perks into
 * "families" so we can show only the highest-level version at the active loadout.
 */
function perkFamilyKey(name: string): string {
  return name
    .replace(/\s+(Niv|Lvl?|Level)\.?\s*\d+\s*$/i, "")
    .replace(/\s+(Niv|Lvl?|Level)\s*\d+\s*$/i, "")
    .trim()
    .toLowerCase();
}

/**
 * Given the unit's full perks list and a current level, return the active
 * loadout — i.e. the highest-level version of every perk family whose base
 * unlock level is <= current level.
 */
function buildActiveLoadout(perks: Perk[], currentLevel: number): Perk[] {
  const byFamily = new Map<string, Perk>();
  for (const p of perks) {
    if (p.lvl > currentLevel) continue;
    const key = perkFamilyKey(p.name);
    const existing = byFamily.get(key);
    if (!existing || p.lvl > existing.lvl) {
      byFamily.set(key, p);
    }
  }
  // Order: passives first, then active skills, then stats; stable inside each bucket.
  const order: Record<string, number> = {
    passive: 0,
    "active-skill": 1,
    "active-compétence": 1,
    stat: 2,
  };
  return Array.from(byFamily.values()).sort((a, b) => {
    const oa = order[a.type] ?? 3;
    const ob = order[b.type] ?? 3;
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name, "fr");
  });
}

function tierFor(lvl: number, L: UILabels): string {
  if (lvl >= 12) return L.maxLevel;
  if (lvl >= 9) return L.veteran;
  if (lvl >= 5) return L.experienced;
  if (lvl >= 3) return L.trained;
  return L.novice;
}

export function UnitDetailClient({ unit }: { unit: UnitData }) {
  const [lvl, setLvl] = useState(1);
  /** Snapshot of `lvl` *before* the latest change, so stat cells can show the
   *  per-step delta as an animated chip when the user steps the slider. */
  const prevLvlRef = useRef(1);
  const [prevLvl, setPrevLvl] = useState(1);

  const locale = useLocale();
  const L = LABELS[locale] ?? LABELS.en;
  const perkName = (p: Perk) =>
    localizedField(p as unknown as Record<string, unknown>, "name", locale) || p.name;
  const perkDesc = (p: Perk) =>
    localizedField(p as unknown as Record<string, unknown>, "desc", locale) || p.desc;

  const setLvlSafe = (n: number) => {
    const clamped = Math.max(1, Math.min(12, n));
    prevLvlRef.current = lvl;
    setPrevLvl(lvl);
    setLvl(clamped);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setLvlSafe(lvl + 1);
      if (e.key === "ArrowLeft") setLvlSafe(lvl - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lvl]);

  const i = lvl - 1;
  const pi = Math.max(0, prevLvl - 1);
  const s = unit.stats;

  const activeLoadout = useMemo(
    () => buildActiveLoadout(unit.perks, lvl),
    [unit.perks, lvl]
  );

  const levelBarLabels: LevelBarLabels = {
    level: L.level,
    prevAria: L.prevAria,
    nextAria: L.nextAria,
    hint: L.hint,
    tierFor: (n) => tierFor(n, L),
    levelAria: L.levelAria,
  };

  return (
    <div id="stats">
      <StickyLevelBar lvl={lvl} setLvl={setLvlSafe} labels={levelBarLabels} />

      {/* STATS */}
      <div className="bg-panel border border-border rounded-lg p-3.5 md:p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gold2 font-bold uppercase tracking-widest text-sm md:text-base m-0">
            {L.statsTitle} <span>{lvl}</span>
          </h3>
          <span className="text-[10px] md:text-[11px] text-muted uppercase tracking-widest">
            Δ {L.level} 1
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          <Stat
            icon="⚔️"
            name={L.attack}
            val={s.atk[i]}
            base={s.atk[0]}
            prev={s.atk[pi]}
            accent
          />
          <Stat
            icon="🛡️"
            name={L.defense}
            val={s.def[i]}
            base={s.def[0]}
            prev={s.def[pi]}
            accent
          />
          <Stat icon="❤️" name={L.hp} val={s.hp[i]} base={s.hp[0]} prev={s.hp[pi]} />
          <Stat
            icon="🏃"
            name={L.movement}
            val={s.mov[i]}
            base={s.mov[0]}
            prev={s.mov[pi]}
          />
          <Stat icon="🎯" name={L.range} val={s.rng[i]} base={s.rng[0]} prev={s.rng[pi]} />
        </div>
      </div>

      {/* ACTIVE LOADOUT */}
      <div id="loadout" className="bg-panel border border-border rounded-lg p-4 md:p-5 mb-6">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-gold2 font-bold uppercase tracking-widest text-sm md:text-base m-0">
            {L.activeLoadout} — {L.level} {lvl}
          </h3>
          <span className="text-muted text-[10px] uppercase tracking-widest">
            {L.skillCount(activeLoadout.length)}
          </span>
        </div>
        {activeLoadout.length === 0 ? (
          <div className="text-muted text-sm italic text-center py-3">
            {L.noneUnlocked}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeLoadout.map((p, idx) => {
              const justUnlocked = p.lvl === lvl;
              return (
                <div
                  key={idx}
                  className={`relative border rounded-lg p-3 transition-shadow ${
                    p.milestone
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-border bg-bg3"
                  }`}
                  style={
                    justUnlocked
                      ? {
                          boxShadow:
                            "0 0 0 2px rgb(var(--c-gold2) / 0.40), 0 4px 12px rgb(var(--c-gold) / 0.20)",
                        }
                      : undefined
                  }
                >
                  {justUnlocked && (
                    <div
                      className="absolute font-black uppercase tracking-widest"
                      style={{
                        top: -8,
                        right: 10,
                        background:
                          "linear-gradient(135deg, rgb(var(--c-gold2)), rgb(var(--c-gold)))",
                        color: "rgb(var(--c-bg))",
                        fontSize: 9,
                        padding: "2px 7px",
                        borderRadius: 4,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                      }}
                    >
                      {L.newBadge}
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <div
                      className="grid place-items-center shrink-0 rounded-lg"
                      style={{
                        width: 36,
                        height: 36,
                        background: p.milestone
                          ? "rgb(var(--c-accent) / 0.18)"
                          : "rgb(var(--c-gold) / 0.12)",
                        border: `1px solid ${
                          p.milestone ? "rgb(var(--c-accent))" : "rgb(var(--c-gold))"
                        }`,
                        fontSize: 18,
                      }}
                    >
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        <h4 className="m-0 text-sm font-bold text-ink">{perkName(p)}</h4>
                        <PerkBadge type={p.type} locale={locale} />
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider text-muted border border-border rounded px-1.5 py-px"
                          style={{ background: "rgb(var(--c-bg-deep))" }}
                        >
                          L{p.lvl}
                        </span>
                      </div>
                      <p className="m-0 text-xs md:text-[12.5px] text-dim leading-relaxed">
                        {perkDesc(p)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-3 text-muted text-[11px] italic">{L.loadoutHint}</div>
      </div>

      {/* INTERACTIVE TIMELINE */}
      <div id="perks" className="bg-panel border border-border rounded-lg p-4 md:p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gold2 font-bold uppercase tracking-widest text-sm md:text-base m-0">
            {L.chronHeading}
          </h3>
          <span className="text-muted text-[10px] uppercase tracking-widest">
            {unit.perks.length} {L.totalAt}
          </span>
        </div>
        <p className="text-muted text-xs mb-4 italic">{L.chronBody}</p>

        <div className="relative">
          <div
            className="absolute"
            style={{
              left: 18,
              top: 8,
              bottom: 8,
              width: 2,
              background: "rgb(var(--c-border))",
            }}
            aria-hidden="true"
          />
          {unit.perks.map((p, idx) => {
            const unlocked = p.lvl <= lvl;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setLvlSafe(p.lvl)}
                aria-label={L.levelAria(p.lvl)}
                className="w-full flex items-start gap-3 py-3 cursor-pointer transition-opacity text-left"
                style={{ opacity: unlocked ? 1 : 0.4 }}
              >
                <div
                  className="relative grid place-items-center shrink-0"
                  style={{ width: 38, zIndex: 1 }}
                >
                  <div
                    className="grid place-items-center font-serif font-black"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: unlocked
                        ? p.milestone
                          ? "linear-gradient(135deg, rgb(var(--c-accent)), #8b1d15)"
                          : "linear-gradient(135deg, rgb(var(--c-gold)), rgb(var(--c-khaki)))"
                        : "rgb(var(--c-bg3))",
                      border: `2px solid ${
                        unlocked
                          ? p.milestone
                            ? "rgb(var(--c-accent))"
                            : "rgb(var(--c-gold))"
                          : "rgb(var(--c-border))"
                      }`,
                      color: unlocked ? "rgb(var(--c-bg))" : "rgb(var(--c-muted))",
                      fontSize: 14,
                      boxShadow: unlocked
                        ? `0 0 0 4px ${
                            p.milestone
                              ? "rgb(var(--c-accent) / 0.15)"
                              : "rgb(var(--c-gold) / 0.15)"
                          }`
                        : "none",
                    }}
                  >
                    {p.lvl}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center flex-wrap gap-1.5 mb-1">
                    <span className="text-base">{p.icon}</span>
                    <h4
                      className="m-0 text-[13.5px] font-bold"
                      style={{
                        color: unlocked ? "rgb(var(--c-ink))" : "rgb(var(--c-muted))",
                      }}
                    >
                      {perkName(p)}
                    </h4>
                    <PerkBadge type={p.type} locale={locale} />
                    {p.milestone && (
                      <span
                        className="text-xs"
                        style={{ color: "rgb(var(--c-accent))" }}
                        aria-hidden="true"
                      >
                        ⭐
                      </span>
                    )}
                  </div>
                  <p
                    className="m-0 text-xs md:text-[12.5px] leading-relaxed"
                    style={{
                      color: unlocked ? "rgb(var(--c-dim))" : "rgb(var(--c-muted))",
                    }}
                  >
                    {perkDesc(p)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  name,
  val,
  base,
  prev,
  accent,
}: {
  icon: string;
  name: string;
  val: number;
  base: number;
  prev: number;
  accent?: boolean;
}) {
  const delta = val - base;
  const stepDelta = val - prev;
  return (
    <div
      className={`relative rounded-md p-2 md:p-3 flex items-center gap-2 md:block md:text-center border ${
        accent ? "border-gold/40" : "border-border bg-bg3"
      }`}
      style={
        accent
          ? {
              background:
                "linear-gradient(135deg, rgb(var(--c-gold) / 0.10), rgb(var(--c-accent) / 0.04))",
            }
          : undefined
      }
    >
      <div className="text-base md:text-lg md:mb-1 shrink-0">{icon}</div>
      <div className="text-[10px] md:text-[11px] text-muted uppercase tracking-wide md:tracking-widest md:mb-1 min-w-0 truncate flex-1">
        {name}
      </div>
      <div className="text-base md:text-2xl text-gold2 font-extrabold tabular-nums shrink-0 leading-none">
        {val}
      </div>
      {delta > 0 && (
        <div className="absolute top-1 right-1 md:top-2 md:right-2 text-[9px] md:text-[10px] text-ok font-bold">
          +{delta}
        </div>
      )}
      {stepDelta > 0 && (
        <div
          key={`${name}-${val}`}
          className="absolute bottom-1 right-1 text-[9px] text-ok font-bold rounded px-1"
          style={{
            background: "rgb(var(--c-ok) / 0.15)",
            animation: "etwPopIn 280ms ease",
          }}
        >
          ↑{stepDelta}
        </div>
      )}
    </div>
  );
}

function PerkBadge({ type, locale = "en" }: { type: string; locale?: string }) {
  const BY_LOCALE: Record<string, Record<string, { label: string; cls: string }>> = {
    fr: {
      "active-skill": { label: "Compétence active", cls: "bg-accent/15 border-accent text-accent" },
      passive: { label: "Passif", cls: "bg-ok/15 border-ok text-ok" },
      stat: { label: "Stat", cls: "bg-gold/15 border-gold text-gold2" },
    },
    en: {
      "active-skill": { label: "Active skill", cls: "bg-accent/15 border-accent text-accent" },
      passive: { label: "Passive", cls: "bg-ok/15 border-ok text-ok" },
      stat: { label: "Stat", cls: "bg-gold/15 border-gold text-gold2" },
    },
    de: {
      "active-skill": { label: "Aktive Fähigkeit", cls: "bg-accent/15 border-accent text-accent" },
      passive: { label: "Passiv", cls: "bg-ok/15 border-ok text-ok" },
      stat: { label: "Statuswert", cls: "bg-gold/15 border-gold text-gold2" },
    },
  };
  const map = BY_LOCALE[locale] ?? BY_LOCALE.en;
  const m = map[type] ?? map.passive;
  return (
    <span
      className={`inline-block text-[9px] border rounded px-1.5 py-px uppercase tracking-widest font-semibold ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
