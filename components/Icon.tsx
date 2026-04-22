import type { SVGProps } from "react";

export type IconName =
  | "games"
  | "hub"
  | "guide"
  | "units"
  | "generals"
  | "skills"
  | "tech"
  | "scenarios"
  | "leaderboard"
  | "compare"
  | "news"
  | "search"
  | "warning"
  | "instagram"
  | "reddit"
  | "chevron"
  | "menu"
  | "close";

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number | string;
  title?: string;
};

/**
 * Monoline 24×24 icon sprite consumer. Fetches /icons.svg once
 * (browser caches) and references symbols by id. `currentColor`
 * strokes/fills so Tailwind color utilities work as expected.
 */
export default function Icon({
  name,
  size = 20,
  title,
  className,
  ...rest
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <use href={`/icons.svg#i-${name}`} />
    </svg>
  );
}
