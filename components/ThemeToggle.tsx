"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Toggle theme"
        className={`btn btn-sm px-2.5 py-2 opacity-70 ${className}`}
      >
        <span className="w-4 h-4 block" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-sm px-3 py-2 transition-all duration-300 flex items-center gap-1.5 ${
        isDark ? "bg-purple text-white shadow-pop-sm" : "bg-card text-ink shadow-pop-sm"
      } ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 text-lime absolute inset-0 transition-all duration-300 transform ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        />
        <Moon
          className={`w-4 h-4 text-purple absolute inset-0 transition-all duration-300 transform ${
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
      </span>
      <span className="font-mono text-[11px] font-bold hidden sm:inline-block transition-opacity duration-300">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
