/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "var(--color-bg)",
          surface: "var(--color-surface)",
          border: "var(--color-border)",
          cardBg: "var(--color-card-bg)",
          hoverBg: "var(--color-hover-bg)",
          mutedText: "var(--color-muted-text)",
        },
        brand: {
          DEFAULT: "var(--color-brand)",
          light: "var(--color-brand-light)",
          dark: "var(--color-brand-dark)",
        },
        theme: {
          text: "var(--color-text)",
          muted: "var(--color-muted-text)",
          panel: "var(--color-panel)",
          panelAlt: "var(--color-panel-alt)",
        },
      },
      fontFamily: {
        sans: [
          "Outfit",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Open Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Courier New",
          "Courier",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
