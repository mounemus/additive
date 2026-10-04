/**
 * Le site est servi sous https://buypukka.ca/additive (le plugin WordPress
 * « Additive — Passerelle Vercel » relaie les requêtes vers Vercel).
 * Doit rester identique à `basePath` dans next.config.mjs.
 */
export const BASE_PATH = "/additive";
export const PUBLIC_URL = `https://buypukka.ca${BASE_PATH}`;

/**
 * Préfixe un chemin racine ("/images/x.jpg", "/api/…") du basePath.
 * Next le fait seul pour <Link>, router et redirect() — PAS pour fetch(),
 * <img>/<video>, next/image en chaîne, ni les URLs stockées en base.
 * Laisse intacts : URLs absolues, data:/blob:, "//cdn", chemins déjà préfixés.
 */
export function withBase<T extends string | null | undefined>(path: T): T {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return path;
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}` as T;
}
