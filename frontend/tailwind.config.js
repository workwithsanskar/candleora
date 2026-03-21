/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#C18C5D",
          secondary: "#F5F5F5",
          accent: "#E8C39E",
          dark: "#333333",
          light: "#FFFFFF",
          muted: "#6E5A47",
          surface: "#FBF7F2",
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Manrope"', '"Segoe UI"', "sans-serif"],
      },
      boxShadow: {
        candle: "0 18px 45px rgba(74, 44, 18, 0.14)",
      },
      backgroundImage: {
        "soft-radial":
          "radial-gradient(circle at top, rgba(232, 195, 158, 0.42), transparent 55%)",
      },
    },
  },
  plugins: [],
};
