// import type { Config } from "tailwindcss";

// const config: Config = {
  // content: [
    // "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    // "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  // ],
  // theme: {
    // extend: {
      // backgroundImage: {
        // "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        // "gradient-conic":
          // "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      // },
    // },
  // },
  // plugins: [],
// };
// export default config;
// 
// tailwind.config.ts
import type { Config } from "tailwindcss";
import { createThemes } from "tw-colors";

// HSL theme tokens (used with class="light"/"dark")
const themes = createThemes({
  light: {
    background: "0 0% 100%",
    foreground: "0 0% 3.9%",
    // add more tokens as needed: primary, border, input, etc.
  },
  dark: {
    background: "0 0% 3.9%",
    foreground: "0 0% 98%",
  },
});

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Premium typography + spacing rhythm
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // Keep your CSS-var driven palette AND add a soft “ink” utility palette
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        ink: {
          900: "#0B1220",
          800: "#111826",
          600: "#334155",
          500: "#475569",
          400: "#64748B",
          300: "#94A3B8",
          200: "#CBD5E1",
          100: "#E2E8F0",
          50:  "#F1F5F9",
        },
      },

      // Softer, larger radii (without breaking your CSS var)
      borderRadius: {
        lg: "var(--radius)",   // keep your existing token
        xl2: "1rem",
        xl3: "1.25rem",
      },

      // Card-like shadows used across the UI
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06), 0 8px 20px rgba(16,24,40,.06)",
        cardHover: "0 1px 2px rgba(16,24,40,.06), 0 12px 32px rgba(16,24,40,.10)",
      },

      // Optional: nicer ring defaults for premium focus states
      ringWidth: {
        3: "3px",
      },
      ringColor: {
        brand: "rgba(59, 130, 246, 0.15)", // blue-500 at 15%
      },
    },
  },
  plugins: [
    themes, // <- activates tw-colors themes you defined above
  ],
};

export default config;
