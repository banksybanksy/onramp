import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "\"Avenir Next\"",
          "\"Segoe UI Variable Display\"",
          "\"Segoe UI\"",
          "\"Helvetica Neue\"",
          "sans-serif"
        ],
        mono: ["\"JetBrains Mono\"", "\"SF Mono\"", "Menlo", "monospace"]
      },
      colors: {
        ink: {
          950: "#070b11",
          900: "#0d1320",
          800: "#152033",
          700: "#22324b"
        },
        line: {
          400: "#3f5676",
          500: "#506887"
        },
        mist: {
          100: "#f5f8fb",
          200: "#d2dce8",
          300: "#a6b5c8"
        },
        accent: {
          400: "#67e8f9",
          500: "#2dd4bf"
        },
        critical: "#f97316",
        major: "#facc15",
        minor: "#38bdf8"
      },
      boxShadow: {
        overlay: "0 24px 80px rgba(4, 8, 15, 0.42)",
        glow: "0 0 0 1px rgba(103, 232, 249, 0.2), 0 18px 60px rgba(45, 212, 191, 0.15)"
      },
      backgroundImage: {
        "panel-fade":
          "linear-gradient(180deg, rgba(7,11,17,0.92) 0%, rgba(7,11,17,0.82) 40%, rgba(7,11,17,0.96) 100%)",
        "hero-grid":
          "linear-gradient(rgba(210,220,232,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(210,220,232,0.04) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
