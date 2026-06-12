/**
 * Utilitaires serveur pour le back-office.
 */

/** Exécute une requête DB en tolérant l'absence de base (retourne le repli). */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[admin] db query failed:", e);
    return fallback;
  }
}

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  in_progress: "En traitement",
  answered: "Répondu",
  archived: "Archivé",
};
