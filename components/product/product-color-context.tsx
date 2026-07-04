"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Sélection de coloris PARTAGÉE entre la fiche produit (ProductDetails) et la
 * galerie (ProductGallery → Model3DViewer) : les deux composants sont des
 * frères rendus par une page serveur, ce provider client les synchronise.
 *
 * `defaultColor` = premier coloris du produit : le GLB représente déjà ce
 * coloris, on ne recolore le modèle que quand la sélection en diffère.
 */

type ProductColorContextValue = {
  color: string | null;
  setColor: (c: string | null) => void;
  defaultColor: string | null;
};

const ProductColorContext = createContext<ProductColorContextValue | null>(null);

export function ProductColorProvider({
  defaultColor = null,
  children,
}: {
  defaultColor?: string | null;
  children: ReactNode;
}) {
  const [color, setColor] = useState<string | null>(defaultColor);
  return (
    <ProductColorContext.Provider value={{ color, setColor, defaultColor }}>
      {children}
    </ProductColorContext.Provider>
  );
}

/**
 * [coloris, setter, coloris par défaut]. Hors provider (ex. composant utilisé
 * seul), repli sur un état local initialisé à `fallback` — rien ne casse.
 */
export function useProductColor(
  fallback: string | null = null
): [string | null, (c: string | null) => void, string | null] {
  const ctx = useContext(ProductColorContext);
  // Toujours appelé (règles des hooks) ; ignoré quand le provider existe.
  const [localColor, setLocalColor] = useState<string | null>(fallback);
  if (ctx) return [ctx.color, ctx.setColor, ctx.defaultColor];
  return [localColor, setLocalColor, fallback];
}
