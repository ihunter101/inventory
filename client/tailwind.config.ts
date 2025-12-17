import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // your neutral “ink” palette from before (optional)
        ink: {
          900: "#0B1220",
          800: "#111826",
          600: "#334155",
          500: "#475569",
          400: "#64748B",
          300: "#94A3B8",
          200: "#CBD5E1",
          100: "#E2E8F0",
          50: "#F1F5F9",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        xl2: "1rem",
        xl3: "1.25rem",
      },

      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06), 0 8px 20px rgba(16,24,40,.06)",
        cardHover:
          "0 1px 2px rgba(16,24,40,.06), 0 12px 32px rgba(16,24,40,.10)",
      },
      ringWidth: {
        3: "3px",
      },
      ringColor: {
        brand: "rgba(22, 163, 74, 0.25)", // green focus ring
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    
  ],
};

export default config;
