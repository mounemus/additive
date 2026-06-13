"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Bascule de langue FR/EN — scaffold Phase 2. Le FR est actif ; le routage i18n
 * complet (préfixe /en, hreflang) sera branché plus tard, l'architecture étant
 * déjà préparée dans lib/i18n.ts.
 */
export function LanguageSwitch() {
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border p-0.5 text-xs">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          title={l === "en" ? "Traduction anglaise — bientôt" : "Français"}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition-colors",
            locale === l ? "bg-foreground text-background" : "text-muted hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
