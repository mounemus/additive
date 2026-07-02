"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "additive.theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  // La classe est déjà posée sur <html> par le script anti-FOUC du layout :
  // on lit l'état effectif plutôt que de recalculer (source de vérité unique).
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Bouton clair/sombre : cycle clair ↔ sombre, persiste dans localStorage
 * (`additive.theme`), défaut = prefers-color-scheme (géré par le script
 * inline du layout). Zone cliquable 44×44px, aria-label explicite.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  const toggle = useCallback(() => {
    // Lit l'état effectif du DOM (source de vérité) et applique la mutation
    // dans le handler — jamais dans l'updater React (double-invocation StrictMode).
    const next: Theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la session.
    }
    setTheme(next);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={cn(
        "focus-ring flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground",
        className
      )}
    >
      {/* Avant le mount, `theme` est null : icône Lune par défaut,
          aria-label recalculé dès la lecture de l'état réel de <html>. */}
      {isDark ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden />
      )}
    </button>
  );
}
