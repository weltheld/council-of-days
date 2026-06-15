import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "var(--parchment)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        hairline: "var(--hairline)",
        wine: "var(--wine)",
        gold: "var(--gold)",
        "gold-soft": "var(--gold-soft)",
        "vote-yes": "var(--vote-yes)",
        "vote-maybe": "var(--vote-maybe)",
        "vote-no": "var(--vote-no)",
        "dm-gold": "var(--dm-gold)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        parchment: "0 8px 32px -8px rgba(43, 33, 24, 0.18), 0 2px 4px rgba(43, 33, 24, 0.06)",
        crest: "0 4px 12px rgba(43, 33, 24, 0.25)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
