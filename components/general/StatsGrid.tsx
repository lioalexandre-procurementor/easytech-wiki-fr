import { useTranslations } from "next-intl";
import type { AttributeKey, AttributeValue, GeneralAttributes } from "@/lib/types";

const ATTR_KEYS: { key: AttributeKey; icon: string }[] = [
  { key: "infantry",  icon: "🪖" },
  { key: "artillery", icon: "🎯" },
  { key: "armor",     icon: "🛡" },
  { key: "navy",      icon: "⚓" },
  { key: "airforce",  icon: "✈" },
  { key: "marching",  icon: "🥾" },
];

export type StatsMode = "base" | "trained";

export function StatsGrid({
  attributes,
  mode,
}: {
  attributes: GeneralAttributes | null | undefined;
  mode: StatsMode;
}) {
  const t = useTranslations();
  const hasAny = attributes && ATTR_KEYS.some(({ key }) => attributes?.[key] != null);

  return (
    <div id="attributes" className="bg-panel border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gold2 font-bold uppercase tracking-widest text-lg">
          ⭐ {t("general.attributes")}
        </h3>
        <span className="text-muted text-[10px] uppercase tracking-widest">
          {hasAny
            ? t(mode === "trained" ? "general.trainedModeHint" : "general.attributeCeiling")
            : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ATTR_KEYS.map(({ key, icon }) => {
          const raw = attributes?.[key] as AttributeValue | null | undefined;
          // In trained mode, collapse start to max so every star is "filled".
          const val = raw
            ? mode === "trained"
              ? { start: raw.max, max: raw.max }
              : raw
            : null;
          return (
            <div key={key} className="border border-border rounded-lg p-3 bg-bg3">
              <div className="text-muted text-[10px] uppercase tracking-widest mb-1.5">
                {icon} {t(`attributeKeys.${key}`)}
              </div>
              <AttributeBar value={val} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttributeBar({ value }: { value: AttributeValue | null }) {
  const t = useTranslations();
  if (!value) {
    return <div className="text-muted text-[11px] italic">{t("general.toVerify")}</div>;
  }
  const MAX_SCALE = 6;
  const start = Math.max(0, Math.min(MAX_SCALE, value.start));
  const max = Math.max(start, Math.min(MAX_SCALE, value.max));
  // Number of stars to actually draw: ceiling only. If max is 0, show an
  // explicit "not used" marker rather than 6 empty slots.
  if (max === 0) {
    return <div className="text-muted text-[11px] italic">—</div>;
  }
  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex items-center gap-0.5 text-[15px] leading-none"
        aria-label={`${start}/${max}`}
      >
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < start;
          const shiny = i === 5;
          return (
            <span
              key={i}
              className={
                filled
                  ? shiny
                    ? "text-amber-300 drop-shadow"
                    : "text-gold"
                  : shiny
                  ? "text-amber-300/30"
                  : "text-gold/20"
              }
              style={{
                WebkitTextStroke: !filled ? "0.5px currentColor" : undefined,
              }}
            >
              {filled ? "★" : "☆"}
            </span>
          );
        })}
        <span className="ml-1.5 text-[10px] font-bold tabular-nums text-gold2">
          {start}/{max}
        </span>
      </div>
      {max > start && (
        <div className="text-dim text-[10px] italic">
          {t("general.potentialSuffix", { delta: max - start })}
        </div>
      )}
    </div>
  );
}
