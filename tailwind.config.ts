import type { Config } from "tailwindcss";

const withVar = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Theme swapping is handled by CSS variables — no dark: variants needed.
  theme: {
    extend: {
      colors: {
        bg: withVar("--c-bg"),
        bg2: withVar("--c-bg2"),
        bg3: withVar("--c-bg3"),
        "bg-deep": withVar("--c-bg-deep"),
        panel: withVar("--c-panel"),
        "panel-2": withVar("--c-panel-2"),
        border: withVar("--c-border"),
        gold: withVar("--c-gold"),
        gold2: withVar("--c-gold2"),
        khaki: withVar("--c-khaki"),
        accent: withVar("--c-accent"),
        ink: withVar("--c-ink"),
        dim: withVar("--c-dim"),
        muted: withVar("--c-muted"),
        ok: withVar("--c-ok"),
        tierS: withVar("--c-tierS"),
        tierA: withVar("--c-tierA"),
        tierB: withVar("--c-tierB"),
        tierC: withVar("--c-tierC"),
      },
      fontFamily: {
        serif: ["Georgia", "ui-serif", "serif"],
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        pop: "var(--shadow-pop)",
      },
    },
  },
  plugins: [],
};
export default config;
