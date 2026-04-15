"use client";

/**
 * Reopens the Google Funding Choices consent revocation dialog so visitors
 * can withdraw or change their consent at any time. CNIL art. 82 requires
 * that withdrawing consent be as easy as giving it.
 *
 * Funding Choices exposes `window.googlefc.showRevocationMessage()` once the
 * CMP loader has booted. We queue the call through `googlefc.callbackQueue`
 * which handles the race where the user clicks the link before the loader
 * has finished initialising.
 */
export default function ManageCookiesLink({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (typeof window === "undefined") return;
        const w = window as unknown as {
          googlefc?: {
            callbackQueue?: Array<() => void>;
            showRevocationMessage?: () => void;
          };
        };
        if (!w.googlefc) {
          // Funding Choices hasn't loaded yet (ad blocker, slow network, or
          // consent message not yet published in AdSense). Fall back to the
          // cookies policy page so the visitor still has a path to manage
          // their preferences via browser settings.
          window.location.href = "/legal/cookies";
          return;
        }
        w.googlefc.callbackQueue = w.googlefc.callbackQueue || [];
        w.googlefc.callbackQueue.push(() => {
          w.googlefc?.showRevocationMessage?.();
        });
      }}
    >
      {label}
    </button>
  );
}
