import { NextResponse } from "next/server";
import { computeQuote } from "@/lib/configurator";
import { getPricingConfig } from "@/lib/configurator-settings";
import { quoteOptionsSchema } from "@/lib/validations";

/**
 * Devis du configurateur. TOUJOURS calculé ici, côté serveur, à partir de la
 * grille tarifaire administrable — le client n'affiche jamais un total qu'il a
 * calculé lui-même. Aucun frais « génération IA ».
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = quoteOptionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }

  const pricing = await getPricingConfig();
  return NextResponse.json(computeQuote(parsed.data, pricing));
}
