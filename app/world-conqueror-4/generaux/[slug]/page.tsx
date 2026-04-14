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
  getCandidatesForGeneralSlot,
  GENERAL_CATEGORY_META,
  COUNTRY_FLAGS,
  FACTION_META,
} from "@/lib/units";
import type {
  Metadata,
} from "next";
import type {
  AttributeKey,
  AttributeValue,
  GeneralQuality,
  GeneralSkill,
  TrainingStage,
} from "@/lib/types";

export function generateStaticParams() {
  return getAllGeneralSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGeneral(params.slug);
  if (!g) return { title: "Général introuvable" };
  return {
    title: `${g.name} (WC4) — Compétences, attributs & guide | Wiki FR`,
    description: `Fiche complète du général ${g.name} dans World Conqueror 4 : ${g.shortDesc} Attributs, skills, training, unités recommandées.`,
  };
}

const QUALITY_META: Record<
  GeneralQuality,
  { label: string; icon: string; color: string; slots: number }
> = {
  bronze:  { label: "Bronze",  icon: "🥉", color: "#cd7f32", slots: 3 },
  silver:  { label: "Silver",  icon: "🥈", color: "#c0c0c0", slots: 4 },
  gold:    { label: "Gold",    icon: "🥇", color: "#d4a44a", slots: 5 },
  marshal: { label: "Marshal", icon: "⭐", color: "#ff6b6b", slots: 5 },
};

const ATTR_LABELS: { key: AttributeKey; label: string; icon: string }[] = [
  { key: "infantry",  label: "Infanterie", icon: "🪖" },
  { key: "artillery", label: "Artillerie", icon: "🎯" },
  { key: "armor",     label: "Blindé",     icon: "🛡" },
  { key: "navy",      label: "Marine",     icon: "⚓" },
  { key: "airforce",  label: "Aviation",   icon: "✈" },
  { key: "marching",  label: "Marche",     icon: "🥾" },
];

export default function GeneralPage({ params }: { params: { slug: string } }) {
  const g = getGeneral(params.slug);
  if (!g) notFound();

  const m = GENERAL_CATEGORY_META[g.category];
  const scorpion = g.faction === "scorpion";
  const faction = FACTION_META[g.faction];
  const quality = QUALITY_META[g.quality];

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

  const hasAnyAttribute =
    g.attributes &&
    ATTR_LABELS.some(({ key }) => g.attributes?.[key] != null);

  const replaceableCount = g.skills.filter((s) => s.replaceable).length;

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
            {g.hasTrainingPath && (
              <li><a href="#training" className="block px-2 py-1 text-dim no-underline hover:text-gold2">⚔ Entraînement (Épées/Sceptres)</a></li>
            )}
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
                borderColor: scorpion ? "#c8372d" : quality.color,
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
                    : `linear-gradient(135deg, #8b7d4a, ${quality.color})`,
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
              <div className="absolute bottom-2.5 left-2.5">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border"
                  style={{
                    borderColor: quality.color,
                    background: `${quality.color}22`,
                    color: quality.color,
                  }}
                >
                  {quality.icon} {quality.label}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl text-gold2 font-extrabold mb-1">{g.name}</h1>
              <div className="text-dim text-sm mb-4">{g.shortDesc}</div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Tag accent>{m.icon} Général {m.label}</Tag>
                <Tag>{COUNTRY_FLAGS[g.country] || "🏳"} {g.countryName}</Tag>
                <Tag>🎖 Tier {g.rank}</Tag>
                <Tag accent>{quality.icon} {quality.label} · {quality.slots} slots</Tag>
                <Tag accent>{acqPillText}</Tag>
                {g.hasTrainingPath && <Tag accent>⚔ Training Épées/Sceptres</Tag>}
                {replaceableCount > 0 && (
                  <Tag accent>🎓 {replaceableCount} slot{replaceableCount > 1 ? "s" : ""} libre{replaceableCount > 1 ? "s" : ""}</Tag>
                )}
                <Tag scorpion={scorpion}>
                  {scorpion ? "🦂" : "🌍"} {faction.label}
                </Tag>
                {!g.verified && <Tag>⚠ Données à vérifier in-game</Tag>}
              </div>
              <p className="text-ink text-sm leading-relaxed">{g.longDesc}</p>
            </div>
          </div>

          {/* ATTRIBUTES (6 aptitudes) */}
          <div id="attributes" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg">
                ⭐ Attributs
              </h3>
              <span className="text-muted text-[10px] uppercase tracking-widest">
                {hasAnyAttribute ? "Actuel + plafond via promotions" : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ATTR_LABELS.map(({ key, label, icon }) => {
                const val = (g.attributes?.[key] ?? null) as AttributeValue | null;
                return (
                  <div
                    key={key}
                    className="border border-border rounded-lg p-3 bg-bg3"
                  >
                    <div className="text-muted text-[10px] uppercase tracking-widest mb-1.5">
                      {icon} {label}
                    </div>
                    <AttributeBar value={val} />
                  </div>
                );
              })}
            </div>
            {!hasAnyAttribute && (
              <div className="mt-3 text-muted text-[11px] italic">
                Valeurs à capturer depuis l'émulateur (Académie militaire → fiche du général).
                Chaque attribut est noté de 0 à 5 étoiles, avec une 6ᵉ étoile « shiny bonus » rare pour les aptitudes maxées.
              </div>
            )}
          </div>

          {/* SKILLS — inline vote widget for replaceable slots */}
          <div id="skills" className="bg-panel border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg">
                ⚡ Compétences
              </h3>
              <span className="text-muted text-[10px] uppercase tracking-widest">
                {g.skills.length} slot{g.skills.length > 1 ? "s" : ""} · qualité {quality.label}
              </span>
            </div>
            <div className="space-y-3">
              {g.skills.map((s) => (
                <SkillBlock key={s.slot} skill={s} generalSlug={g.slug} category={g.category} />
              ))}
            </div>
            {replaceableCount > 0 && (
              <div className="mt-4 text-muted text-[11px] italic">
                🎓 Les slots marqués « libre » peuvent être remplacés via l'Académie pour
                {" "}<strong>des médailles</strong>. Vous pouvez voter pour votre préférence —
                les résultats communautaires apparaissent ci-dessous chaque slot.
              </div>
            )}
          </div>

          {/* TRAINING PATH (Swords/Sceptres of Dominance) */}
          {g.hasTrainingPath && g.training && (
            <div
              id="training"
              className="border-2 rounded-lg p-6 mb-6"
              style={{
                borderColor: "#d4a44a",
                background:
                  "linear-gradient(135deg, rgba(212,164,74,0.10) 0%, rgba(212,164,74,0.02) 100%), #1a2230",
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg">
                  ⚔ Entraînement (Épées/Sceptres de Domination)
                </h3>
                <div className="flex gap-2">
                  {g.training.totalSwordCost != null && (
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded border bg-gold/20 border-gold/40 text-gold2">
                      ⚔ {g.training.totalSwordCost} épées
                    </span>
                  )}
                  {g.training.totalSceptreCost != null && (
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded border bg-gold/20 border-gold/40 text-gold2">
                      🪄 {g.training.totalSceptreCost} sceptres
                    </span>
                  )}
                </div>
              </div>
              {g.training.summary && (
                <p className="text-dim text-sm mb-4 italic">{g.training.summary}</p>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.training.stages.map((stage) => (
                  <TrainingStageCard key={stage.stage} stage={stage} />
                ))}
              </div>
              <div className="mt-4 text-muted text-[11px] italic">
                💡 Les Épées et Sceptres de Domination sont une ressource premium : ~4 épées + 2 sceptres
                gratuits par mois via la boutique. Seuls les généraux de qualité bronze, silver ou gold
                peuvent être entraînés — les Maréchaux (IAP) n'ont pas de training path.
              </div>
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
                {g.acquisition.notes || "Détails d'obtention à confirmer in-game."}
                {g.acquisition.type === "campaign" && (
                  <p className="mt-2 text-amber-200 text-xs">
                    ⚠ Ce général est débloqué via la campagne (non-obtenable en Conquête libre).
                  </p>
                )}
                {g.acquisition.type === "medals" && (
                  <p className="mt-2 text-muted text-xs">
                    🎖 Les médailles sont obtenues en complétant des missions de campagne et en gagnant des Conquêtes.
                  </p>
                )}
                {g.acquisition.type === "iron-cross" && (
                  <p className="mt-2 text-amber-200 text-xs">
                    💰 Ce général Marshal ne peut être obtenu qu'avec des Croix de fer (IAP).
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

// ─── components ──────────────────────────────────────────────────────────

function AttributeBar({ value }: { value: AttributeValue | null }) {
  if (!value) {
    return <div className="text-muted text-[11px] italic">— à vérifier</div>;
  }
  const MAX_SCALE = 6;
  const start = Math.max(0, Math.min(MAX_SCALE, value.start));
  const max = Math.max(start, Math.min(MAX_SCALE, value.max));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-0.5 text-base leading-none" aria-label={`${start}/${max} (max ${MAX_SCALE})`}>
        {Array.from({ length: MAX_SCALE }).map((_, i) => {
          const filled = i < start;
          const potential = i >= start && i < max;
          const shiny = i === 5 && max >= 6; // 6th star = shiny bonus
          return (
            <span
              key={i}
              className={
                shiny
                  ? "text-amber-300 drop-shadow"
                  : filled
                  ? "text-gold"
                  : potential
                  ? "text-gold/30"
                  : "text-border"
              }
            >
              ★
            </span>
          );
        })}
      </div>
      <div className="text-muted text-[10px] tabular-nums">
        {start}/{max}
        {max > start && (
          <span className="text-dim"> (potentiel +{max - start})</span>
        )}
      </div>
    </div>
  );
}

function SkillBlock({
  skill,
  generalSlug,
  category,
}: {
  skill: GeneralSkill;
  generalSlug: string;
  category: string;
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

  // Re-fetch the general & candidates server-side (the page already resolved g;
  // this keeps the component pure).
  const g = getGeneral(generalSlug);
  const candidates =
    skill.replaceable && g
      ? getCandidatesForGeneralSlot(g, skill.slot)
      : [];
  void category;

  return (
    <div
      className={`border rounded-lg p-4 ${
        skill.replaceable ? "border-gold/40 bg-gold/5" : "bg-bg3 border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-muted text-[10px] uppercase tracking-widest font-bold">
            Slot {skill.slot}
          </span>
          <span className="text-gold2 font-bold text-sm">{skill.name}</span>
          {skill.replaceable && (
            <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border bg-gold/15 border-gold/40 text-gold2">
              🎓 Libre
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rating && (
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${ratingColor}`}
            >
              {rating}
            </span>
          )}
        </div>
      </div>
      <div className="text-dim text-sm leading-relaxed">{skill.desc}</div>
      {skill.replaceableReason && (
        <div className="text-muted text-[10px] italic mt-1">
          {skill.replaceableReason}
        </div>
      )}

      {skill.replaceable && candidates.length > 0 && (
        <TrainedSkillVote
          generalSlug={generalSlug}
          slot={skill.slot}
          currentSkillName={skill.name}
          candidates={candidates}
        />
      )}
    </div>
  );
}

function TrainingStageCard({ stage }: { stage: TrainingStage }) {
  return (
    <div className="border border-gold/30 rounded-lg p-3 bg-bg3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gold2 font-bold text-xs uppercase tracking-widest">
          Étape {stage.stage}
        </span>
        <div className="flex gap-1">
          {stage.swordCost != null && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold/20 border border-gold/40 text-gold2">
              ⚔ {stage.swordCost}
            </span>
          )}
          {stage.sceptreCost != null && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold/20 border border-gold/40 text-gold2">
              🪄 {stage.sceptreCost}
            </span>
          )}
        </div>
      </div>
      {stage.label && (
        <div className="text-dim text-xs mb-1">{stage.label}</div>
      )}
      {stage.notes && (
        <div className="text-muted text-[11px] italic">{stage.notes}</div>
      )}
      {(stage.skillChanges?.length ?? 0) > 0 && (
        <div className="mt-2 text-[11px] text-dim">
          <div className="text-muted uppercase tracking-widest text-[9px] mb-0.5">Effets</div>
          <ul className="list-disc pl-4 space-y-0.5">
            {stage.skillChanges!.map((c, i) => (
              <li key={i}>
                Slot {c.slot} : {c.kind === "unlock" ? "🆕" : c.kind === "upgrade" ? "⬆" : "♻"}{" "}
                {c.newName || c.notes || "modification"}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(!stage.swordCost && !stage.sceptreCost && !stage.notes) && (
        <div className="text-muted text-[11px] italic mt-1">
          Coût à vérifier in-game.
        </div>
      )}
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
