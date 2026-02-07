"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className="rounded-lg p-2 text-[var(--text-tertiary)] transition-all hover:text-[var(--text-secondary)] hover:bg-[var(--accent-surface)]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};
