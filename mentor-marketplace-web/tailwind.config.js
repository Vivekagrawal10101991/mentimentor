/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,css}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#243B8F",
          dark: "#101A5C",
          lime: "#DFFF2F",
          sand: "#F6F7F2",
          muted: "#626262",
        },
        primary: {
          50: "#eef1fb",
          100: "#d9e0f5",
          200: "#b3c1eb",
          300: "#8ca2e0",
          400: "#5b74c4",
          500: "#243B8F",
          600: "#1e327a",
          700: "#101A5C",
          800: "#0c1447",
          900: "#080e33",
        },
        background: "#F6F7F2",
        foreground: "#111111",
        border: "rgba(36, 59, 143, 0.12)",
        "input-background": "#EAECF0",
      },
      fontFamily: {
        sans: [
          "Manrope",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        card:
          "0 1px 2px rgba(16, 26, 92, 0.04), 0 8px 28px rgba(36, 59, 143, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.88)",
        "card-hover":
          "0 4px 14px rgba(16, 26, 92, 0.08), 0 20px 48px rgba(36, 59, 143, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.88)",
        soft: "0 2px 12px rgba(36, 59, 143, 0.14)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      transitionDuration: {
        250: "250ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        shimmer: "shimmer 1.35s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
