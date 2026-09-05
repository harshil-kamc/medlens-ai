import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ThemeMode } from "../types";
import { loadTheme, saveTheme } from "../lib/storage";

interface ThemeCtx {
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ mode: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(loadTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    saveTheme(mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ mode, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
