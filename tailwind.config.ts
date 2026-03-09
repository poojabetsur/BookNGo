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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary:    '#111111',
        accent:     '#F5C518',
        dark:       '#1A1A1A',
        'gray-mid': '#444444',
        surface:    '#F5F5F5',
        muted:      '#888888',
      },
    },
  },
  plugins: [],
};
export default config;
