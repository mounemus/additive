import { NextResponse } from "next/server";
import { wornPortraitSchema } from "@/lib/validations";
import {
  buildWornPortraitPromptFr,
  buildConcepts,
  conceptByLabel,
  type StyleTag,
} from "@/lib/configurator";
import { generateImage } from "@/lib/ai/image-provider";

/**
 * Portrait porté : la personne portant EXACTEMENT la monture choisie, identité
 * strictement préservée. Nécessite un fournisseur d'IA configuré et la photo du
 * client (transmise transitoirement, jamais stockée ici). Sans IA, renvoie
 * `unavailable` (le client propose alors l'essayage par superposition).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = wornPortraitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const styleTags = parsed.data.styleTags as StyleTag[];
  const tpl = conceptByLabel(parsed.data.conceptLabel);
  // Reconstruit un concept complet pour le prompt (notes de design).
  const concept =
    buildConcepts(null, styleTags, "equilibre").find((c) => c.label === parsed.data.conceptLabel) ??
    (tpl
      ? { ...tpl, id: "x", matchRate: 80 }
      : null);

  if (!concept) return NextResponse.json({ error: "unknown_concept" }, { status: 422 });

  const prompt = buildWornPortraitPromptFr(concept, styleTags);
  const result = await generateImage({
    prompt,
    referenceImages: [parsed.data.photo],
    size: "1024x1024",
  });

  if (!result.ok) {
    // Message générique — aucun détail de fournisseur exposé.
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({ image: result.dataUrl });
}
