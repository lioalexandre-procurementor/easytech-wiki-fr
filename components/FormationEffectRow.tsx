import { FormationScopeIcon } from "./FormationScopeIcon";
import type { FormationEffect, AppliesTo } from "@/lib/types";

function localized(effect: FormationEffect, field: "name" | "desc", locale?: string): string {
  if (locale === "en") return (effect as unknown as Record<string, string>)[`${field}En`] || effect[field];
  if (locale === "de") return (effect as unknown as Record<string, string>)[`${field}De`] || effect[field];
  return effect[field];
}

export function FormationEffectRow({
  effect,
  locale,
}: {
  effect: FormationEffect;
  locale?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-panel/70 p-3 flex gap-3">
      <div className="flex flex-col gap-1 flex-shrink-0">
        {effect.appliesTo.map((scope) => (
          <FormationScopeIcon key={scope} scope={scope} size={18} />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-gold2 font-semibold text-sm mb-1">{localized(effect, "name", locale)}</h4>
        <p className="text-text/90 text-sm leading-relaxed">{localized(effect, "desc", locale)}</p>
      </div>
    </div>
  );
}

export function FormationGeneralBuff({
  text,
  appliesTo,
}: {
  text: string;
  appliesTo: AppliesTo[];
}) {
  return (
    <div className="rounded-lg border border-gold/40 bg-gradient-to-br from-panel to-bg3 p-3 flex gap-3">
      <div className="flex flex-col gap-1 flex-shrink-0">
        {appliesTo.map((scope) => (
          <FormationScopeIcon key={scope} scope={scope} size={18} />
        ))}
      </div>
      <p className="text-gold2 font-medium text-sm leading-relaxed flex-1">{text}</p>
    </div>
  );
}
