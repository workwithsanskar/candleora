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
          blush: "#E9D6CB",
          olive: "#7A8768",
          cocoa: "#4B3426",
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
