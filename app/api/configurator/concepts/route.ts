import { NextResponse } from "next/server";
import { conceptsGenSchema } from "@/lib/validations";
import {
  buildConcepts,
  buildConceptPromptFr,
  profilePalette,
  computeQuote,
  DEFAULT_QUOTE_OPTIONS,
  type StyleTag,
  type FaceShape,
  type Boldness,
} from "@/lib/configurator";
import { getPricingConfig } from "@/lib/configurator-settings";
import { generateImage } from "@/lib/ai/image-provider";
import { demoConceptSvg } from "@/lib/ai/demo-visuals";
import { guard, RULES } from "@/lib/rate-limit";

// 3 générations d'images en parallèle : durée bornée explicitement.
export const maxDuration = 60;

/**
 * Génère 3 concepts MAXIMUM, cohérents avec le moodboard (même palette/matière)
 * et adaptés à la morphologie. Les données (label, notes, scores d'imprimabilité
 * et de correspondance) viennent du moteur déterministe ; l'image vient de l'IA
 * si configurée (conditionnée sur le moodboard), sinon d'un rendu SVG de démo.
 * Les meilleurs taux de correspondance sont renvoyés en tête.
 */
export async function POST(req: Request) {
  const limited = await guard(req, "ai", RULES.ai);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = conceptsGenSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const styleTags = parsed.data.styleTags as StyleTag[];
  const faceShape = (parsed.data.faceShape as FaceShape) ?? null;
  const boldness = parsed.data.boldness as Boldness;
  const palette = profilePalette(styleTags);
  const moodboard = parsed.data.moodboardImage;

  const concepts = buildConcepts(faceShape, styleTags, boldness);
  const pricing = await getPricingConfig();

  // Génère les visuels en parallèle (chaque concept conditionné sur le moodboard).
  const enriched = await Promise.all(
    concepts.map(async (concept, i) => {
      const prompt = buildConceptPromptFr(concept, styleTags, faceShape);
      const result = await generateImage(
        {
          prompt,
          referenceImages: moodboard ? [moodboard] : undefined,
          size: "1024x1024",
        },
        "concepts"
      );
      const image = result.ok
        ? result.dataUrl
        : demoConceptSvg(concept.label, palette.colors, 3 + i);
      // « À partir de » = EXACTEMENT le devis serveur avec les options par
      // défaut → la carte et le premier devis affichent le même montant.
      const fromPrice = computeQuote(
        { conceptLabel: concept.label, boldness, ...DEFAULT_QUOTE_OPTIONS },
        pricing
      ).total;
      return { ...concept, basePrice: fromPrice, image, ai: result.ok };
    })
  );

  return NextResponse.json({ concepts: enriched });
}
