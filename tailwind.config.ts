import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gap: {
          positive: "#22c55e",
          negative: "#ef4444",
          neutral: "#a3a3a3",
        },
      },
    },
  },
  plugins: [],
};
export default config;
