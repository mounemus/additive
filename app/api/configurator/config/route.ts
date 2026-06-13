import { NextResponse } from "next/server";
import {
  getPricingConfig,
  getConsentText,
  isImageGenerationActive,
} from "@/lib/configurator-settings";

/**
 * Configuration PUBLIQUE du configurateur (aucun secret) :
 *  - texte de consentement (modifiable en admin) ;
 *  - listes d'options tarifaires (libellés/notes, pour les sélecteurs) ;
 *  - indicateur générique d'activation de la génération IA (sans nom de
 *    fournisseur).
 */
export async function GET() {
  const [pricing, consent, aiActive] = await Promise.all([
    getPricingConfig(),
    getConsentText(),
    isImageGenerationActive(),
  ]);

  return NextResponse.json({
    consent,
    aiActive,
    currency: pricing.currency,
    options: {
      materials: pricing.materials.map(({ id, label, note }) => ({ id, label, note })),
      finishes: pricing.finishes.map(({ id, label, note }) => ({ id, label, note })),
      lenses: pricing.lenses.map(({ id, label, note }) => ({ id, label, note })),
      delivery: pricing.delivery.map(({ id, label, note }) => ({ id, label, note })),
      urgency: pricing.urgency.map(({ id, label, note }) => ({ id, label, note })),
    },
  });
}
