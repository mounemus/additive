import { NextResponse } from "next/server";
import { modulairSelectionSchema } from "@/lib/validations";
import { buildModulairPromptFr, type ModulairSelection } from "@/lib/modulair";
import { generateImage } from "@/lib/ai/image-provider";
import { guard, RULES } from "@/lib/rate-limit";

// Génération d'image : durée bornée explicitement.
export const maxDuration = 60;

/**
 * Rendu studio IA d'une combinaison MODUL'AIR (face × branches × couleurs ×
 * verres × finition). Réutilise la tâche « concepts ». Sans IA configurée → 503
 * (le configurateur garde son aperçu SVG composé côté client).
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

  const parsed = modulairSelectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const prompt = buildModulairPromptFr(parsed.data as ModulairSelection);
  const result = await generateImage({ prompt, size: "1024x1024" }, "concepts");
  if (!result.ok) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  return NextResponse.json({ image: result.dataUrl });
}
