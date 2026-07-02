import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildWornPortraitPromptFr,
  buildConcepts,
  conceptByLabel,
  type StyleTag,
} from "@/lib/configurator";
import { generateWornPortrait } from "@/lib/ai/image-provider";
import { guard, RULES } from "@/lib/rate-limit";
import { sanitizePhotoDataUrl } from "@/lib/image-sanitize";

// Édition photo IA : durée bornée explicitement.
export const maxDuration = 60;

const schema = z.object({
  conceptLabel: z.string().max(120),
  styleTags: z.array(z.string().max(40)).max(8).default([]),
  photo: z.string().max(8_000_000), // data URL de la photo du client
  conceptImage: z.string().max(8_000_000).optional(), // rendu studio du concept
  conceptSummary: z.string().max(2000).optional(),
});

/**
 * Portrait porté : la personne portant EXACTEMENT la monture choisie, identité
 * STRICTEMENT préservée. Route le rendu via Gemini (photo + image du concept)
 * ou OpenAI /images/edits — jamais /images/generations. Sans IA, `unavailable`.
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  // Photo du client : vérifie que c'est bien une image (magic bytes) et la
  // ramène à 1024 px JPEG — réduit le payload provider et bloque les abus.
  const cleanPhoto = await sanitizePhotoDataUrl(parsed.data.photo);
  if (!cleanPhoto) return NextResponse.json({ error: "invalid_photo" }, { status: 422 });

  const styleTags = parsed.data.styleTags as StyleTag[];
  const tpl = conceptByLabel(parsed.data.conceptLabel);
  const concept =
    buildConcepts(null, styleTags, "equilibre").find((c) => c.label === parsed.data.conceptLabel) ??
    (tpl ? { ...tpl, id: "x", matchRate: 80 } : null) ??
    {
      id: "custom",
      label: parsed.data.conceptLabel,
      summary: parsed.data.conceptSummary ?? "Monture sur-mesure imprimée en 3D.",
      designNotes: [],
      printability: 90,
      matchRate: 90,
      basePrice: 250,
      complexity: "medium" as const,
      tags: [] as StyleTag[],
    };

  const prompt = buildWornPortraitPromptFr(concept, styleTags, Boolean(parsed.data.conceptImage));
  const result = await generateWornPortrait({
    prompt,
    photo: cleanPhoto,
    conceptImage: parsed.data.conceptImage,
  });

  if (!result.ok) {
    // Message générique — aucun détail de fournisseur exposé.
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  return NextResponse.json({ image: result.dataUrl });
}
