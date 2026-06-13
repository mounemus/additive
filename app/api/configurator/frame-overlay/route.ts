import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildFrameOverlayPromptFr,
  buildConcepts,
  conceptByLabel,
  type StyleTag,
} from "@/lib/configurator";
import { generateFrameOverlay } from "@/lib/ai/image-provider";

const schema = z.object({
  conceptLabel: z.string().max(120),
  styleTags: z.array(z.string().max(40)).max(8).default([]),
  conceptImage: z.string().max(8_000_000).optional(),
  conceptSummary: z.string().max(2000).optional(),
});

/**
 * Façade transparente du concept pour l'essayage AR (superposée et ancrée aux
 * landmarks côté client). Renvoie l'image + le fond ('transparent' alpha natif
 * OpenAI, ou 'white' à détourer côté client pour Gemini). Sans IA → 503.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const styleTags = parsed.data.styleTags as StyleTag[];
  const tpl = conceptByLabel(parsed.data.conceptLabel);
  const concept =
    buildConcepts(null, styleTags, "equilibre").find((c) => c.label === parsed.data.conceptLabel) ??
    (tpl ? { ...tpl, id: "x", matchRate: 80 } : null) ??
    // Concept générique (ex. combinaison MODUL'AIR sur-mesure).
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

  const prompt = buildFrameOverlayPromptFr(concept, styleTags);
  const result = await generateFrameOverlay({ prompt, conceptImage: parsed.data.conceptImage });
  if (!result.ok) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  return NextResponse.json({ image: result.dataUrl, bg: result.bg });
}
