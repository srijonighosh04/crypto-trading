import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        card: "#121420",
        "card-light": "#1B1E2E",
        border: "#1F2235",
        "border-hover": "#2D314D",
        primary: {
          DEFAULT: "#6366F1", // Indigo
          hover: "#4F46E5",
        },
        accent: {
          DEFAULT: "#06B6D4", // Cyan
          hover: "#0891B2",
        },
        success: "#10B981", // Emerald
        danger: "#EF4444",  // Red
        text: {
          primary: "#F9FAFB",
          secondary: "#9CA3AF",
          muted: "#6B7280",
        }
      }
    }
  },
  plugins: [],
};

export default config;
