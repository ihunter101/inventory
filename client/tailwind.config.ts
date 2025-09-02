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

import { type Config } from "tailwindcss";
import { createThemes } from "tw-colors";

const themes = createThemes({
  light: {
    background: "0 0% 100%",
    foreground: "0 0% 3.9%",
    // add more custom tokens if needed
  },
  dark: {
    background: "0 0% 3.9%",
    foreground: "0 0% 98%",
    // add more custom tokens if needed
  },
});

const config: Config = {
  darkMode: "class", // <- this is critical!
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // add other color layers if needed
      },
    },
  },
  plugins: [],
};

export default config;
