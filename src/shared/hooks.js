/**
 * Custom React hooks and shared theme synchronization helpers (light/dark mode persistence via localStorage & transient toasts).
 */
import { useState, useEffect } from "react";

const THEME_KEY = "alamin_theme";

// Helper to determine active theme: default to "light"
export function getStoredTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch (e) {}
  return "light";
}

let currentTheme = getStoredTheme();

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const target = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", target);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", target === "dark" ? "#0e1424" : "#1f6feb");
  }
}

// Apply immediately on module evaluation
applyTheme(currentTheme);

const themeListeners = new Set();

export function setTheme(newTheme) {
  const next = newTheme === "dark" ? "dark" : "light";
  currentTheme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {}
  applyTheme(next);
  themeListeners.forEach((fn) => fn(next));
}

export function toggleTheme() {
  setTheme(currentTheme === "dark" ? "light" : "dark");
}

export function useTheme() {
  const [theme, setLocalTheme] = useState(currentTheme);

  useEffect(() => {
    setLocalTheme(currentTheme);
    const handler = (t) => setLocalTheme(t);
    themeListeners.add(handler);
    return () => themeListeners.delete(handler);
  }, []);

  return [theme, toggleTheme, setTheme];
}

export function useToast() {
  const [m, setM] = useState("");
  return [m, (x) => { setM(x); setTimeout(() => setM(""), 2200); }];
}
