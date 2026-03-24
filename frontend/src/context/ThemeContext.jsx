import { createContext, useContext, useEffect, useMemo } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("dark");
    root.dataset.theme = "light";

    if (typeof window !== "undefined") {
      window.localStorage.setItem("candleora-theme", "light");
    }
  }, []);

  const value = useMemo(
    () => ({
      theme: "light",
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
