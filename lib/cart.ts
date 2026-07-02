"use client";

/**
 * Panier local (localStorage) : la configuration validée au configurateur y
 * est déposée et reste disponible dans /cart — l'utilisateur peut fermer
 * l'onglet et finaliser plus tard. Aucune photo n'y est stockée (vie privée,
 * quota localStorage) : seulement des URLs courtes et des choix.
 */

export type CartItem = {
  conceptLabel: string;
  conceptSummary?: string;
  image?: string; // URL courte uniquement (jamais de data URL volumineuse)
  styleTags: string[];
  boldness: string;
  faceShape?: string;
  measurements?: Record<string, number>;
  options: Record<string, string>;
  quoteTotal?: number;
  currency?: string;
  matchRate?: number;
  createdAt: number;
};

const KEY = "additive.cart.v1";
const MAX_IMAGE_CHARS = 2000; // URL http courte OK, data URL exclue de fait

export function saveCartItem(item: Omit<CartItem, "createdAt">): void {
  try {
    const clean: CartItem = {
      ...item,
      image: item.image && item.image.length <= MAX_IMAGE_CHARS ? item.image : undefined,
      createdAt: Date.now(),
    };
    window.localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    // quota / navigation privée : le panier local est un confort, jamais bloquant
  }
}

export function loadCartItem(): CartItem | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const item = JSON.parse(raw) as CartItem;
    if (!item || typeof item.conceptLabel !== "string" || !item.options) return null;
    // Un panier de plus de 30 jours n'a plus de valeur (prix susceptibles d'évoluer).
    if (Date.now() - (item.createdAt ?? 0) > 30 * 24 * 3600_000) {
      clearCartItem();
      return null;
    }
    return item;
  } catch {
    return null;
  }
}

export function clearCartItem(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
