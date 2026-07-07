import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // ── Ochre identity ──
        // The whole app is recoloured by remapping the three scales the UI
        // already uses. `slate` becomes a warm ink→bone neutral, `emerald`
        // becomes ochre (the brand accent), and `teal` becomes gold (the
        // gradient partner). Every existing bg-slate / text-emerald / to-teal
        // class picks this up with no per-component edits.
        slate: {
          50: "#F6F1E6",
          100: "#ECE4D5",
          200: "#DBD1BC",
          300: "#BDB29C",
          400: "#978C7B",
          500: "#726A5C",
          600: "#524B40",
          700: "#3B352D",
          800: "#28241F",
          900: "#1B1815",
          950: "#110F0C",
        },
        emerald: {
          50: "#FBEAD6",
          100: "#F6D3AC",
          200: "#F1B978",
          300: "#ED9F45",
          400: "#E88A2A",
          500: "#E07B1F",
          600: "#C0620F",
          700: "#984D0D",
          800: "#6F3A10",
          900: "#4B2910",
          950: "#2A1608",
        },
        teal: {
          50: "#FDF1D9",
          100: "#FADFA8",
          200: "#F6C86D",
          300: "#F2B441",
          400: "#EFA324",
          500: "#E08F17",
          600: "#B87211",
          700: "#8A5410",
          800: "#5E3A11",
          900: "#3E2810",
          950: "#221507",
        },
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
