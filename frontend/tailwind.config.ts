import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "#0d0f14",
          2: "#13161e",
          3: "#1a1e28",
          4: "#21263a",
        },
        border: {
          DEFAULT: "#2a2f42",
          2: "#363d57",
        },
        green: {
          DEFAULT: "#00e5a0",
          2: "#00b87f",
        },
        amber: { DEFAULT: "#f5a623" },
        red: { DEFAULT: "#ff4757" },
        blue: { DEFAULT: "#4d9fff" },
        purple: { DEFAULT: "#9b7fff" },
      },
    },
  },
  plugins: [],
};
export default config;
