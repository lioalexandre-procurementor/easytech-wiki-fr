import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f1419",
        bg2: "#151c24",
        bg3: "#1c2530",
        panel: "#1a2230",
        border: "#2a3544",
        gold: "#d4a44a",
        gold2: "#f2c265",
        khaki: "#8b7d4a",
        accent: "#c8372d",
        ink: "#e8ebf0",
        dim: "#9aa5b4",
        muted: "#6b7685",
        ok: "#4a9d5f",
        tierS: "#ff4d4d",
        tierA: "#ff9c40",
        tierB: "#ffd24d",
        tierC: "#6bb86b",
      },
      fontFamily: {
        serif: ["Georgia", "ui-serif", "serif"],
      },
      boxShadow: {
        panel: "0 6px 20px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
