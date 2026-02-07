"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className="button button-ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
};
