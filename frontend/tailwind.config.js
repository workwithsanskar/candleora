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
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Poppins"', '"Segoe UI"', "sans-serif"],
        brand: ['"Playfair Display"', "Georgia", "serif"],
      },
      boxShadow: {
        candle: "0 18px 45px rgba(74, 44, 18, 0.14)",
        editorial: "0 30px 80px rgba(75, 52, 38, 0.16)",
        float: "0 14px 35px rgba(75, 52, 38, 0.12)",
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
