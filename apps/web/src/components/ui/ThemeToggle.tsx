"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AnimatedThemeToggler } from "./animated-theme-toggler";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <AnimatedThemeToggler
      variant="circle"
      theme={isDark ? "dark" : "light"}
      onThemeChange={(newTheme) => setTheme(newTheme)}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 overflow-hidden ${className}`}
    />
  );
}
