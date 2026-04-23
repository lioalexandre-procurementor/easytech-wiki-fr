import Image from "next/image";
import Link from "next/link";
import { UnitIcon } from "./UnitIcon";
import type { ResolvedFormationUnit } from "@/lib/formations";

export function FormationUnitRow({ unit }: { unit: ResolvedFormationUnit }) {
  if (unit.kind === "base") {
    return (
      <div className="flex items-center gap-2 bg-panel/50 border border-border rounded-md px-2 py-1.5 text-sm">
        <div className="relative w-7 h-7 rounded bg-bg3 overflow-hidden flex-shrink-0">
          <Image src={unit.sprite} alt={unit.name} fill sizes="28px" className="object-contain p-0.5" />
        </div>
        <span className="text-text">{unit.name}</span>
      </div>
    );
  }
  if (!unit.href) {
    return (
      <div className="flex items-center gap-2 bg-panel/50 border border-border rounded-md px-2 py-1.5 text-sm text-muted">
        <span className="w-6 h-6 rounded bg-bg3" />
        <span>{unit.name}</span>
      </div>
    );
  }
  return (
    <Link
      href={unit.href}
      className="flex items-center gap-2 bg-panel/50 border border-border hover:border-gold/60 rounded-md px-2 py-1.5 text-sm no-underline transition-colors"
    >
      {unit.sprite ? (
        <div className="relative w-7 h-7 rounded bg-bg3 overflow-hidden flex-shrink-0">
          <Image src={unit.sprite} alt={unit.name} fill sizes="28px" className="object-contain p-0.5" />
        </div>
      ) : (
        <UnitIcon category={unit.category} size={28} />
      )}
      <span className="text-gold2 font-medium">{unit.name}</span>
    </Link>
  );
}
