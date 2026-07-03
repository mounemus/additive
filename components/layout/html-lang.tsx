"use client";

import { useEffect } from "react";

/**
 * App Router ne permet pas de changer <html lang> par segment : le layout
 * racine reste lang="fr". Ce composant, monté par le layout /en, ajuste
 * l'attribut côté client (et le restaure en quittant le segment EN) ;
 * la garantie côté serveur est assurée par lang="en" sur le <main> EN.
 */
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous || "fr";
    };
  }, [lang]);

  return null;
}
