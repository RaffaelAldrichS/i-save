"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export type ThemeMode = "system" | "dark" | "light";

export function getNextTheme(current: ThemeMode): ThemeMode {
  if (current === "system") return "dark";
  if (current === "dark") return "light";
  return "system";
}

function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");

  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  } else {
    root.classList.add(mode);
  }
}

export const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("isave-theme") as ThemeMode) || "system";
  });

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const handleToggle = () => {
    const next = getNextTheme(theme);
    setTheme(next);
    localStorage.setItem("isave-theme", next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Ganti tema tampilan (${theme})`}
      className="p-2 rounded-xl border border-border bg-surface-soft text-primary hover:bg-accent transition-colors cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
      title={`Tema Saat Ini: ${theme}. Klik untuk mengganti`}
    >
      {theme === "dark" && <Moon className="w-4 h-4" />}
      {theme === "light" && <Sun className="w-4 h-4" />}
      {theme === "system" && <Monitor className="w-4 h-4" />}
    </button>
  );
};
