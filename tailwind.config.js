/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sembly design system — forest green primary, gold accent
        forest: {
          50: "#EAF3EE",
          100: "#CFE3D7",
          200: "#A3CAB3",
          300: "#6FAA88",
          400: "#3F8A60",
          500: "#1B6B3A", // primary
          600: "#175C32",
          700: "#124A29",
          800: "#0D381F",
          900: "#072414",
        },
        gold: {
          50: "#FDF6E9",
          100: "#FAE9C6",
          200: "#F3D08A",
          300: "#EDB951",
          400: "#E8A020", // accent
          500: "#C9871A",
          600: "#A06A12",
          700: "#7A500D",
        },
        ink: "#14201A",     // near-black with a green tint for text
        paper: "#FAFAF7",   // warm off-white page background
        line: "#E7E9E4",    // hairline borders
      },
      fontFamily: {
        // wired to next/font CSS variables in app/layout.js
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dmsans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,32,26,0.04), 0 8px 24px -12px rgba(20,32,26,0.12)",
        soft: "0 1px 3px rgba(20,32,26,0.06)",
        pop: "0 12px 40px -12px rgba(20,32,26,0.25)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease both",
      },
    },
  },
  plugins: [],
};
