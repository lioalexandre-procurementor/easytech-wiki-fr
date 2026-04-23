"use client";

import { analytics } from "@/lib/analytics";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  network: string;
  location?: "footer" | "header" | "body";
};

/**
 * Anchor wrapper that emits a GA4 `outbound_click` event on every click.
 * Use for any external link we want to instrument (social, partners,
 * affiliate targets). Pass the network/destination as a stable short
 * identifier so the event keeps its cardinality in check.
 */
export function OutboundLink({
  network,
  location = "body",
  href,
  onClick,
  children,
  ...rest
}: Props) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        analytics.outboundClick({ network, href, location });
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
