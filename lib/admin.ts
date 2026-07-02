/**
 * Utilitaires serveur pour le back-office.
 */

import { revalidatePath } from "next/cache";

/**
 * Invalide le cache ISR du catalogue après une mutation admin
 * (produits/collections) : le site public reflète le changement immédiatement,
 * sans attendre la fenêtre de revalidation.
 */
export function revalidateCatalog(): void {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/produits", "layout");
    revalidatePath("/collections", "layout");
  } catch (e) {
    console.error("[admin] revalidation échouée:", e);
  }
}

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
