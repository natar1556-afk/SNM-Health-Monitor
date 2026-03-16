import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const getSystemTheme = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");
  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    const applyTheme = () => {
      const next = theme === "system" ? getSystemTheme() : theme;
      setResolvedTheme(next);
      document.body.classList.remove("theme-dark", "theme-light");
      document.body.classList.add(next === "dark" ? "theme-dark" : "theme-light");
    };

    applyTheme();

    if (theme === "system" && window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      media.addEventListener?.("change", handler);
      return () => media.removeEventListener?.("change", handler);
    }
  }, [theme]);

  const changeTheme = (value) => {
    setTheme(value);
    localStorage.setItem("theme", value);
  };

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme: changeTheme }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
