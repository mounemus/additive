"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { localeAlternate, pathLocale, t, type Locale } from "@/lib/i18n";

/**
 * Bascule de langue FR ↔ EN. Pointe vers l'équivalent de la page courante
 * (localeAlternate) ; sur une page sans équivalent (configurateur, panier…),
 * renvoie vers l'accueil de l'autre langue. Cibles tactiles ≥ 44px.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const current: Locale = pathLocale(pathname);
  const alternatePath = localeAlternate(pathname);

  return (
    <nav
      aria-label={t("localeSwitch.aria", current)}
      className={cn(
        "inline-flex items-center rounded-full border border-border p-0.5 text-xs",
        className
      )}
    >
      {(["fr", "en"] as const).map((l) => {
        const active = l === current;
        const label = l === "fr" ? t("localeSwitch.toFr", current) : t("localeSwitch.toEn", current);
        const inner = (
          <span
            className={cn(
              "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-2.5 uppercase transition-colors",
              active
                ? "bg-foreground font-medium text-background"
                : "text-muted hover:text-foreground"
            )}
          >
            {l}
          </span>
        );
        if (active) {
          return (
            <span key={l} aria-current="true" title={label}>
              {inner}
            </span>
          );
        }
        return (
          <Link
            key={l}
            href={alternatePath}
            hrefLang={l}
            lang={l}
            aria-label={label}
            title={label}
            className="focus-ring rounded-full"
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
