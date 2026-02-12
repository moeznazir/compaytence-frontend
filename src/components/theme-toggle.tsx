"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Defer theme-dependent output until after mount to avoid hydration mismatch
  // (server uses default "light"; client may rehydrate with "dark" from persist)
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Theme toggle"
        className="p-2 rounded-lg text-theme-text-muted hover:bg-theme-surface-elevated hover:text-theme-text transition-colors h-9 w-9"
      >
        <Moon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg text-theme-text-muted hover:bg-theme-surface-elevated hover:text-theme-text transition-colors"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
