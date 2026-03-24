/** @type {import('tailwindcss').Config} */
const withOpacity = (variableName) => `rgb(var(${variableName}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: withOpacity("--color-brand-primary"),
          secondary: withOpacity("--color-brand-secondary"),
          accent: withOpacity("--color-brand-accent"),
          dark: withOpacity("--color-brand-dark"),
          light: withOpacity("--color-brand-light"),
          muted: withOpacity("--color-brand-muted"),
          surface: withOpacity("--color-brand-surface"),
          blush: withOpacity("--color-brand-blush"),
          olive: withOpacity("--color-brand-olive"),
          cocoa: withOpacity("--color-brand-cocoa"),
        },
        success: "#2E7D32",
        danger: "#D32F2F",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Poppins"', '"Segoe UI"', "sans-serif"],
        brand: ['"Playfair Display"', "Georgia", "serif"],
      },
      fontSize: {
        "heading-lg": "2.5rem",
        "heading-md": "2rem",
        "heading-sm": "1.5rem",
        body: "1rem",
      },
      boxShadow: {
        candle: "0 8px 24px rgba(0, 0, 0, 0.08)",
        editorial: "0 8px 24px rgba(0, 0, 0, 0.08)",
        float: "0 8px 24px rgba(0, 0, 0, 0.08)",
      },
      backgroundImage: {
        "soft-radial":
          "radial-gradient(circle at top, rgba(232, 195, 158, 0.42), transparent 55%)",
        "paper-glow":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(247, 236, 223, 0.92))",
      },
    },
  },
  plugins: [],
};
