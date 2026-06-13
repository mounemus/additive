/**
 * Architecture multilingue FR/EN — fondations (Phase 2).
 *
 * Le français est la langue principale ; la structure permet une traduction
 * anglaise complète. Les chaînes principales sont centralisées ici. Les noms
 * propres de collections (MODUL'AIR, GENERATIVE, HYBRIDE) ne se traduisent pas.
 *
 * Le routage i18n complet (préfixe /en, hreflang) sera branché en phase
 * ultérieure ; ce module fournit déjà le type, le dictionnaire et le helper.
 */

export type Locale = "fr" | "en";
export const LOCALES: Locale[] = ["fr", "en"];
export const DEFAULT_LOCALE: Locale = "fr";

type Dict = Record<string, { fr: string; en: string }>;

export const strings = {
  "nav.collections": { fr: "Collections", en: "Collections" },
  "nav.models": { fr: "Modèles", en: "Models" },
  "nav.customize": { fr: "Personnalisation", en: "Customize" },
  "nav.technology": { fr: "Technologie", en: "Technology" },
  "nav.manifesto": { fr: "Manifeste", en: "Manifesto" },
  "nav.about": { fr: "À propos", en: "About" },
  "nav.contact": { fr: "Contact", en: "Contact" },
  "cta.create": { fr: "Créer mes lunettes", en: "Create my glasses" },
  "cta.explore": { fr: "Explorer les collections", en: "Explore the collections" },
  "tagline": {
    fr: "Pas conçues pour tout le monde. Conçues pour vous.",
    en: "Not made for everyone. Made for you.",
  },
  "footer.newsletter.title": { fr: "Restez informé", en: "Stay in the loop" },
  "footer.newsletter.placeholder": { fr: "Votre email", en: "Your email" },
  "footer.newsletter.cta": { fr: "S’inscrire", en: "Subscribe" },
  "footer.rights": { fr: "Tous droits réservés.", en: "All rights reserved." },
} satisfies Dict;

export type StringKey = keyof typeof strings;

/** Récupère une chaîne traduite (repli FR). */
export function t(key: StringKey, locale: Locale = DEFAULT_LOCALE): string {
  return strings[key]?.[locale] ?? strings[key]?.fr ?? key;
}
