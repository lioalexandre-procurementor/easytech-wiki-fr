import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import TrainedSkillVote from "@/components/TrainedSkillVote";
import {
  getAllGeneralSlugs,
  getGeneral,
  getAllGenerals,
  getEliteUnit,
  GENERAL_CATEGORY_META,
  COUNTRY_FLAGS,
  FACTION_META,
} from "@/lib/units";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllGeneralSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGeneral(params.slug);
  if (!g) return { title: "Général introuvable" };
  return {
    title: `${g.name} (WC4) — Compétences, bonus & unités recommandées | Wiki FR`,
    description: `Fiche complète du général ${g.name} dans World Conqueror 4 : ${g.shortDesc} Skills, bonus, meilleures unités à coupler.`,
  };
}

export default function GeneralPage({ params }: { params: { slug: string } }) {
  const g = getGeneral(params.slug);
  if (!g) notFound();

  const m = GENERAL_CATEGORY_META[g.category];
  const scorpion = g.faction === "scorpion";
  const faction = FACTION_META[g.faction];

  const related = getAllGenerals()
    .filter((x) => x.slug !== g.slug && x.category === g.category)
    .slice(0, 3);

  const recommended = g.recommendedUnits
    .map((slug) => getEliteUnit(slug))
    .filter((u): u is NonNullable<typeof u> => u !== null);

  const ACQUISITION_LABEL: Record<string, { icon: string; label: string }> = {
    starter: { icon: "🥇", label: "Starter" },
    medals: { icon: "🎖", label: "Médailles" },
    "iron-cross": { icon: "✠", label: "Croix de fer" },
    coin: { icon: "🪙", label: "Pièces" },
    campaign: { icon: "🎬", label: "Campagne" },
    event: { icon: "📅", label: "Événement" },
  };
  const acqMeta = ACQUISITION_LABEL[g.acquisition.type] || { icon: "🎁", label: g.acquisition.type };
  const acqPillText =
    g.acquisition.cost != null
      ? `${acqMeta.icon} ${g.acquisition.cost} ${acqMeta.label.toLowerCase()}`
      : `${acqMeta.icon} ${acqMeta.label}`;

  // Attribute labels
  const ATTR_LABELS: { key: keyof NonNullable<typeof g.attributes>; label: string; icon: string }[] = [
    { key: "offense", label: "Offensif", icon: "⚔️" },
    { key: "defense", label: "Défensif", icon: "🛡" },
    { key: "intelligence", label: "Intelligence", icon: "🧠" },
    { key: "charisma", label: "Charisme", icon: "⭐" },
  ];

  return (
    <>
      <TopBar />
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 text-xs text-muted">
        <Link href="/" className="text-dim">Accueil</Link> <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4" className="text-dim">World Conqueror 4</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <Link href="/world-conqueror-4/generaux" className="text-dim">Généraux</Link>{" "}
        <span className="mx-2 text-border">›</span>
        <span>{g.name}</span>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pb-20 grid lg:grid-cols-[240px_1fr] gap-7">
        <aside className="bg-panel border border-border rounded-lg p-4 h-fit lg:sticky lg:top-20">
          <h4 className="text-gold2 text-xs uppercase tracking-widest mb-1.5 border-b border-border pb-1.5">
            Sur cette page
          </h4>
          <ul className="list-none text-sm">
            <li><a href="#attributes" className="block px-2 py-1 text-dim no-underline hover:text-gold2">⭐ Attributs</a></li>
            <li><a href="#skills" className="block px-2 py-1 text-dim no-underline hover:text-gold2">⚡ Compétences</a></li>
            {g.trained && <li><a href="#trained" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🎓 Version entraînée</a></li>}
            <li><a href="#bonuses" className="block px-2 py-1 text-dim no-underline hover:text-gold2">📊 Bonus</a></li>
            <li><a href="#acquisition" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🎁 Obtention</a></li>
            <li><a href="#units" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🛡 Unités recommandées</a></li>
          </ul>
          <h4 className="text-gold2 text-xs uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1.5">
            Navigation
          </h4>
          <ul className="list-none text-sm">
            <li><Link href="/world-conqueror-4/generaux" className="block px-2 py-1 text-dim no-underline hover:text-gold2">← Tous les généraux</Link></li>
            {scorpion && (
              <li><Link href="/world-conqueror-4/empire-du-scorpion" className="block px-2 py-1 text-dim no-underline hover:text-gold2">🦂 Empire du Scorpion</Link></li>
            )}
          </ul>
        </aside>

        <main>
          {/* HEADER */}
          <div className="grid md:grid-cols-[220px_1fr] gap-7 bg-panel border border-border rounded-lg p-6 mb-6">
            <div
              className="rounded-lg border-2 h-[220px] grid place-items-center relative"
              style={{
                borderColor: scorpion ? "#c8372d" : "#d4a44a",
                background: scorpion
                  ? "linear-gradient(135deg, #2a0f12, #1a1418)"
                  : "linear-gradient(135deg, #1a2230, #12161e)",
              }}
            >
              <div
                className="w-28 h-28 rounded-full grid place-items-center text-4xl font-extrabold"
                style={{
                  background: scorpion
                    ? "linear-gradient(135deg, #4a0f12, #c8372d)"
                    : "linear-gradient(135deg, #8b7d4a, #d4a44a)",
                  color: scorpion ? "#fff" : "#0f1419",
                }}
              >
                {scorpion ? "🦂" : g.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="absolute top-2.5 right-2.5">
                <span
                  className={`text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded ${
                    g.rank === "S"
                      ? "bg-red-500/20 border border-red-500/40 text-red-300"
                      : "bg-gold/20 border border-gold/40 text-gold2"
                  }`}
                >
                  Tier {g.rank}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl text-gold2 font-extrabold mb-1">{g.name}</h1>
              <div className="text-dim text-sm mb-4">{g.shortDesc}</div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Tag accent>
                  {m.icon} Général {m.label}
                </Tag>
                <Tag>
                  {COUNTRY_FLAGS[g.country] || "🏳"} {g.countryName}
                </Tag>
                <Tag>🎖 Tier {g.rank}</Tag>
                <Tag accent>{acqPillText}</Tag>
                {g.trained && <Tag accent>🎓 Version entraînée disponible</Tag>}
                <Tag scorpion={scorpion}>
                  {scorpion ? "🦂" : "🌍"} {faction.label}
                </Tag>
                {!g.verified && <Tag>⚠️ Données à vérifier en jeu</Tag>}
              </div>
              <p className="text-ink text-sm leading-relaxed">{g.longDesc}</p>
            </div>
          </div>

          {/* ATTRIBUTES */}
          <div id="attributes" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              ⭐ Attributs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ATTR_LABELS.map(({ key, label, icon }) => {
                const val = g.attributes?.[key];
                return (
                  <div
                    key={key}
                    className="border border-border rounded-lg p-3 bg-bg3"
                  >
                    <div className="text-muted text-[10px] uppercase tracking-widest mb-1">
                      {icon} {label}
                    </div>
                    <StarRow value={val ?? null} max={5} />
                  </div>
                );
              })}
            </div>
            {!g.attributes || Object.values(g.attributes).every((v) => v == null) ? (
              <div className="mt-3 text-muted text-[11px] italic">
                Valeurs à capturer depuis l'émulateur (Académie militaire → fiche du général).
              </div>
            ) : null}
          </div>

          {/* SKILLS */}
          <div id="skills" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              ⚡ Compétences de base
            </h3>
            <div className="space-y-3">
              {g.skills.map((s, i) => (
                <SkillCard key={i} skill={s} />
              ))}
            </div>
          </div>

          {/* TRAINED FORM */}
          {g.trained && (
            <div
              id="trained"
              className="border-2 rounded-lg p-6 mb-6"
              style={{
                borderColor: "#d4a44a",
                background:
                  "linear-gradient(135deg, rgba(212,164,74,0.10) 0%, rgba(212,164,74,0.02) 100%), #1a2230",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg">
                  🎓 Version entraînée
                </h3>
                {g.trained.unlockCost != null && (
                  <span className="bg-gold/20 border border-gold/40 text-gold2 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                    {g.trained.unlockCost}{" "}
                    {g.trained.unlockCurrency === "medals"
                      ? "médailles"
                      : g.trained.unlockCurrency === "iron-cross"
                      ? "✠"
                      : g.trained.unlockCurrency}
                  </span>
                )}
              </div>
              {g.trained.notes && (
                <p className="text-dim text-xs mb-4 italic">{g.trained.notes}</p>
              )}
              <div className="space-y-3">
                {g.trained.skills.map((s, i) => (
                  <SkillCard key={i} skill={s} trained />
                ))}
              </div>

              {g.trained.trainedSlots && g.trained.trainedSlots.length > 0 && (
                <div className="mt-5 space-y-4">
                  <div className="text-muted text-[10px] uppercase tracking-widest font-bold border-t border-gold/20 pt-4">
                    🗳 Vote communautaire — slots entraînables
                  </div>
                  {g.trained.trainedSlots.map((ts) => (
                    <TrainedSkillVote
                      key={ts.slot}
                      generalSlug={g.slug}
                      slotData={ts}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BONUSES */}
          <div id="bonuses" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              📊 Bonus appliqués
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {g.bonuses.map((b, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg p-3 bg-bg3 text-center"
                >
                  <div className="text-muted text-[10px] uppercase tracking-widest mb-1">
                    {b.target}
                  </div>
                  <div className="text-gold2 font-extrabold text-xl">{b.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ACQUISITION */}
          <div id="acquisition" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
              🎁 Comment obtenir {g.name}
            </h3>
            <div className="grid md:grid-cols-[auto_1fr] gap-5 items-center">
              <div className="border-2 border-gold rounded-lg p-4 text-center min-w-[160px]">
                <div className="text-4xl mb-2">{acqMeta.icon}</div>
                <div className="text-gold2 font-bold text-base mb-1">{acqMeta.label}</div>
                {g.acquisition.cost != null ? (
                  <div className="text-gold font-extrabold text-2xl">
                    {g.acquisition.cost}
                  </div>
                ) : (
                  <div className="text-muted text-[11px] italic">Coût à confirmer</div>
                )}
              </div>
              <div className="text-dim text-sm leading-relaxed">
                {g.acquisition.notes || "Détails d'obtention à confirmer en jeu."}
                {g.acquisition.type === "campaign" && (
                  <p className="mt-2 text-amber-200 text-xs">
                    ⚠️ Ce général est débloqué via la campagne (non-obtenable en Conquête libre).
                  </p>
                )}
                {g.acquisition.type === "medals" && (
                  <p className="mt-2 text-muted text-xs">
                    🎖 Les médailles sont obtenues en complétant des missions de campagne et en gagnant des Conquêtes.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="ad-slot">Emplacement publicitaire</div>

          {/* RECOMMENDED UNITS */}
          {recommended.length > 0 && (
            <div id="units" className="bg-panel border border-border rounded-lg p-6 mb-6">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg mb-4">
                🛡 Unités recommandées avec ce général
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map((u) => (
                  <Link
                    key={u.slug}
                    href={`/world-conqueror-4/unites-elite/${u.slug}`}
                    className="block bg-bg3 border border-border rounded-lg p-4 hover:border-gold transition-colors no-underline"
                  >
                    <div className="text-gold2 font-bold text-sm mb-1">{u.name}</div>
                    <div className="text-dim text-xs line-clamp-2">{u.shortDesc}</div>
                    <div className="text-muted text-[10px] uppercase tracking-widest mt-2">
                      {COUNTRY_FLAGS[u.country]} {u.countryName} · Tier {u.tier}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {g.recommendedUnits.length > recommended.length && (
            <div className="text-muted text-xs mb-6">
              Unités également mentionnées mais pas encore dans le wiki :{" "}
              {g.recommendedUnits
                .filter((slug) => !recommended.find((u) => u.slug === slug))
                .join(", ")}
            </div>
          )}

          {/* RELATED */}
          {related.length > 0 && (
            <>
              <h2 className="text-xl mb-4 mt-8">
                Autres généraux {m.label.toLowerCase()}
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/world-conqueror-4/generaux/${r.slug}`}
                    className="block bg-panel border border-border rounded-lg p-4 hover:border-gold transition-colors no-underline"
                  >
                    <h3 className="text-gold2 font-bold text-base mb-1">{r.name}</h3>
                    <p className="text-dim text-xs line-clamp-2">{r.shortDesc}</p>
                    <div className="text-muted text-[10px] uppercase tracking-widest mt-2">
                      {COUNTRY_FLAGS[r.country]} · Tier {r.rank}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* SOURCES */}
          {g.sources && g.sources.length > 0 && (
            <div className="text-muted text-xs mt-8">
              <b>Sources :</b> {g.sources.join(" · ")}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}

function StarRow({ value, max = 5 }: { value: number | null; max?: number }) {
  if (value == null) {
    return (
      <div className="text-muted text-[11px] italic">— à vérifier</div>
    );
  }
  const filled = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <div className="flex gap-0.5 text-lg leading-none" aria-label={`${filled}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < filled ? "text-gold" : "text-border"}>
          ★
        </span>
      ))}
    </div>
  );
}

function SkillCard({
  skill,
  trained,
}: {
  skill: import("@/lib/types").GeneralSkill;
  trained?: boolean;
}) {
  const rating = skill.rating;
  const ratingColor =
    rating === "S+" || rating === "S"
      ? "bg-red-500/20 border-red-500/40 text-red-300"
      : rating === "A"
      ? "bg-gold/20 border-gold/40 text-gold2"
      : rating === "B"
      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
      : "bg-bg3 border-border text-dim";

  return (
    <div
      className={`border rounded-lg p-4 ${trained ? "bg-gold/5" : "bg-bg3"}`}
      style={{ borderColor: trained ? "rgba(212,164,74,0.3)" : undefined }}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-muted text-[10px] uppercase tracking-widest font-bold">
            Slot {skill.slot}
          </span>
          <span className="text-gold2 font-bold text-sm">{skill.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {skill.stars != null && <StarRow value={skill.stars} max={5} />}
          {rating ? (
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${ratingColor}`}
            >
              {rating}
            </span>
          ) : (
            <span className="text-muted text-[10px] italic">grade ?</span>
          )}
        </div>
      </div>
      <div className="text-dim text-sm leading-relaxed">{skill.desc}</div>
    </div>
  );
}

function Tag({
  children,
  accent,
  scorpion,
}: {
  children: React.ReactNode;
  accent?: boolean;
  scorpion?: boolean;
}) {
  if (scorpion) {
    return (
      <span
        className="px-2.5 py-1 rounded-xl text-xs font-semibold border text-red-200"
        style={{ background: "rgba(200,55,45,0.15)", borderColor: "#c8372d" }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
        accent ? "bg-gold/15 border-gold text-gold2" : "bg-bg3 border-border text-dim"
      }`}
    >
      {children}
    </span>
  );
}
