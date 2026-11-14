import type { Config } from "tailwindcss";

// Deep Field design tokens. Keep in sync with lib/tokens.ts and app/globals.css.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050816",
        panel: "#0C1430",
        starlight: "#EAF1FF",
        muted: "#8FA0C4",
        moon: "#7FD6FF",
        mars: "#FF7A45",
        silent: "#FFB547",
        live: "#4DFFB0",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
