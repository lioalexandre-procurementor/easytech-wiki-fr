"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count-up animation for the homepage stat band.
 *
 * Hydration-safe: the server and first client render both output the final
 * formatted value, so there is no markup mismatch and the number is correct
 * even with JS disabled. After mount we re-animate from 0 → value via rAF,
 * gated on an IntersectionObserver so it only fires when scrolled into view.
 * Honors prefers-reduced-motion (skips straight to the final value).
 */
export function CountUp({
  value,
  durationMs = 1400,
  className,
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || value <= 0) return;
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (done.current) return;
      done.current = true;
      const start = performance.now();
      setDisplay(0);
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / durationMs);
        // easeOutExpo for a punchy settle
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(Math.round(eased * value));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
    </span>
  );
}
