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
          '"Avenir Next"',
          '"Segoe UI Variable Display"',
          '"Segoe UI"',
          '"Helvetica Neue"',
          "sans-serif"
        ],
        mono: ['"JetBrains Mono"', '"SF Mono"', "Menlo", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
