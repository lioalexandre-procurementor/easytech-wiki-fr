"use client";

import { useEffect, useState } from "react";
import type { UnitData } from "@/lib/types";

const MILESTONES = [5, 9, 12];

export function UnitDetailClient({ unit }: { unit: UnitData }) {
  const [lvl, setLvl] = useState(1);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setLvl(l => Math.min(12, l + 1));
      if (e.key === "ArrowLeft")  setLvl(l => Math.max(1, l - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const i = lvl - 1;
  const s = unit.stats;
  const fillPct = ((lvl - 1) / 11) * 100;

  const tierLabel =
    lvl >= 12 ? "Niveau maximum" :
    lvl >= 9  ? "Vétéran" :
    lvl >= 5  ? "Expérimenté" :
    lvl >= 3  ? "Formé" : "Débutant";

  const milestoneNotes: Record<number, string> = {
    5:  `⭐ <b>Milestone niveau 5</b> : première compétence majeure débloquée. Premier gros power spike de l'unité.`,
    9:  `⭐ <b>Milestone niveau 9</b> : la communauté NamuWiki recommande de prioriser ce palier pour la plupart des unités d'élite.`,
    12: `⭐ <b>Niveau maximum (12)</b> : pleine puissance, perks emblématiques actifs.`,
  };

  return (
    <>
      {/* STATS */}
      <div className="bg-panel border border-border rounded-lg p-5 mb-6">
        <h3 className="text-gold2 font-bold uppercase tracking-widest text-base mb-3.5">
          Statistiques — Niveau <span>{lvl}</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat icon="⚔️" name="Attaque"   val={s.atk[i]} base={s.atk[0]}/>
          <Stat icon="🛡️" name="Défense"   val={s.def[i]} base={s.def[0]}/>
          <Stat icon="❤️" name="HP"         val={s.hp[i]}  base={s.hp[0]}/>
          <Stat icon="🏃" name="Mouvement" val={s.mov[i]} base={s.mov[0]}/>
          <Stat icon="🎯" name="Portée"    val={s.rng[i]} base={s.rng[0]}/>
        </div>
      </div>

      {/* SLIDER */}
      <div className="bg-panel border border-border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg">🎚 Évolution niveau 1 → 12</h3>
          <div className="flex items-center gap-3">
            <div className="text-gold2 text-4xl font-black font-serif leading-none">{lvl}</div>
            <div>
              <div className="text-muted text-xs uppercase tracking-widest">Niveau actuel</div>
              <div className="text-dim text-sm">{tierLabel}</div>
            </div>
          </div>
        </div>

        <div className="relative py-5">
          <div className="relative h-1.5 bg-bg3 rounded-full">
            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-200"
                 style={{ width: `${fillPct}%`, background: "linear-gradient(90deg, #d4a44a, #f2c265)" }}/>
          </div>
          <div className="absolute top-[12px] left-0 right-0 flex justify-between">
            {Array.from({ length: 12 }, (_, idx) => {
              const n = idx + 1;
              const reached = n <= lvl;
              const isMs = MILESTONES.includes(n);
              const isCurr = n === lvl;
              return (
                <button key={n} onClick={() => setLvl(n)} aria-label={`Niveau ${n}`}
                  className="rounded-full grid place-items-center text-[10px] font-bold transition-all cursor-pointer"
                  style={{
                    width: 20, height: 20,
                    background: reached ? (isMs ? "#c8372d" : "#d4a44a") : "#1c2530",
                    color: reached ? (isMs ? "#fff" : "#0f1419") : "#6b7685",
                    border: `${isMs ? 3 : 2}px solid ${isMs ? "#c8372d" : reached ? "#d4a44a" : "#2a3544"}`,
                    transform: isCurr ? "scale(1.4)" : "scale(1)",
                    boxShadow: isCurr ? "0 0 0 4px rgba(212,164,74,0.3)" : "none",
                  }}>
                  {n}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-3.5 text-[11px] text-muted uppercase tracking-widest">
            <span>Lvl 1</span>
            <span style={{ color: "#c8372d", fontWeight: 700, marginLeft: "26%" }}>Lvl 5 ⭐</span>
            <span style={{ color: "#c8372d", fontWeight: 700 }}>Lvl 9 ⭐</span>
            <span style={{ color: "#c8372d", fontWeight: 700 }}>Lvl 12 ⭐</span>
          </div>
        </div>

        {milestoneNotes[lvl] && (
          <div className="bg-accent/10 border-l-4 border-accent rounded-r p-3 px-3.5 mt-4 text-sm text-dim"
               dangerouslySetInnerHTML={{ __html: milestoneNotes[lvl] }}/>
        )}

        <div className="mt-3.5 text-xs text-muted text-center">
          💡 Cliquez sur un niveau ou utilisez les flèches ←→ du clavier
        </div>
      </div>

      {/* PERKS TIMELINE */}
      <div className="bg-panel border border-border rounded-lg p-6 mb-6">
        <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-5">📜 Perks et compétences par niveau</h3>
        <div className="relative pl-7">
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border"/>
          {unit.perks.map((p, idx) => {
            const unlocked = p.lvl <= lvl;
            return (
              <div key={idx} className="relative grid gap-4 py-3.5"
                   style={{
                     gridTemplateColumns: "60px 1fr",
                     opacity: unlocked ? 1 : 0.35,
                     transition: "opacity 0.3s",
                   }}>
                <span className="absolute -left-[23px] top-5 w-3 h-3 rounded-full"
                      style={{
                        background: unlocked ? (p.milestone ? "#c8372d" : "#d4a44a") : "#1c2530",
                        border: `2px solid ${unlocked ? (p.milestone ? "#c8372d" : "#d4a44a") : "#2a3544"}`,
                        boxShadow: unlocked ? `0 0 0 3px ${p.milestone ? "rgba(200,55,45,0.2)" : "rgba(212,164,74,0.2)"}` : "none",
                      }}/>
                <div className="font-serif text-2xl font-black text-center pt-1.5"
                     style={{ color: unlocked ? "#f2c265" : "#6b7685" }}>{p.lvl}</div>
                <div>
                  <h4 className="text-base text-ink mb-1 flex items-center gap-2">
                    <span className="text-lg">{p.icon}</span> {p.name}
                  </h4>
                  <div>
                    <PerkBadge type={p.type}/>
                    <span className="text-sm text-dim leading-relaxed">{p.desc}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Stat({ icon, name, val, base }: { icon: string; name: string; val: number; base: number }) {
  const delta = val - base;
  return (
    <div className="bg-bg3 border border-border rounded-md p-3 text-center relative">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-[11px] text-muted uppercase tracking-widest mb-1">{name}</div>
      <div className="text-2xl text-gold2 font-extrabold">{val}</div>
      {delta > 0 && <div className="absolute top-2 right-2 text-[10px] text-ok font-bold">+{delta}</div>}
    </div>
  );
}

function PerkBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    "active-skill": { label: "Compétence active", cls: "bg-accent/15 border-accent text-accent" },
    "passive":      { label: "Passif",            cls: "bg-ok/15 border-ok text-ok" },
    "stat":         { label: "Stat",              cls: "bg-gold/15 border-gold text-gold2" },
  };
  const m = map[type] ?? map.passive;
  return (
    <span className={`inline-block text-[10px] border rounded px-2 py-0.5 mr-1.5 uppercase tracking-widest font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}
