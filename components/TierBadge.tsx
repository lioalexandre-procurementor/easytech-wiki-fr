import type { Tier } from "@/lib/types";

const COLORS: Record<Tier, string> = {
  S: "bg-tierS text-white",
  A: "bg-tierA text-white",
  B: "bg-tierB text-[#0f1419]",
  C: "bg-tierC text-white",
};

export function TierBadge({ tier, size = "md" }: { tier: Tier; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-base",
    lg: "w-11 h-11 text-lg",
  };
  return (
    <div className={`${sizes[size]} ${COLORS[tier]} rounded-md grid place-items-center font-black`}>
      {tier}
    </div>
  );
}
