import type { Config } from "tailwindcss";
import nativewind from "nativewind/preset";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [nativewind],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary colors matching web app
        primary: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
          light: "#60a5fa",
          dark: "#0f172a",
        },
        // Background/foreground
        background: {
          DEFAULT: "#ffffff",
          dark: "#0f172a",
        },
        foreground: {
          DEFAULT: "#1a1a1a",
          dark: "#f8fafc",
        },
        // Muted
        muted: {
          DEFAULT: "#f8fafc",
          foreground: "#64748b",
          dark: "#1e293b",
          "foreground-dark": "#94a3b8",
        },
        // Border
        border: {
          DEFAULT: "#e2e8f0",
          dark: "#334155",
        },
        // Card
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1a",
          dark: "#1e293b",
          "foreground-dark": "#f8fafc",
        },
        // Secondary
        secondary: {
          DEFAULT: "#f1f5f9",
          foreground: "#334155",
          dark: "#334155",
          "foreground-dark": "#cbd5e1",
        },
        // Destructive
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
          dark: "#f87171",
          "foreground-dark": "#0f172a",
        },
        // Semantic status colors
        status: {
          "want-to-read": "#f1f5f9",
          "want-to-read-text": "#475569",
          "want-to-read-border": "#cbd5e1",
          reading: "#dbeafe",
          "reading-text": "#1e40af",
          "reading-border": "#93c5fd",
          completed: "#dcfce7",
          "completed-text": "#166534",
          "completed-border": "#86efac",
          dnf: "#fef2f2",
          "dnf-text": "#991b1b",
          "dnf-border": "#fca5a5",
        },
        // CAWPILE rating colors
        rating: {
          green: "#22c55e",
          yellow: "#eab308",
          orange: "#f97316",
          red: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
