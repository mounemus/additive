import { NextResponse } from "next/server";
import { modulairSelectionSchema } from "@/lib/validations";
import { buildModulairPromptFr, type ModulairSelection } from "@/lib/modulair";
import { generateImage } from "@/lib/ai/image-provider";
import { guard, RULES } from "@/lib/rate-limit";
import { makeCacheKey, getCachedImage, persistAndCache, logAiCall } from "@/lib/ai/image-store";
import { getTaskConfig } from "@/lib/configurator-settings";

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

  // Cache : une combinaison MODUL'AIR est déterministe → même sélection,
  // même rendu. Très fort taux de réutilisation entre visiteurs.
  const cfg = await getTaskConfig("concepts");
  const cacheKey = makeCacheKey("modulair", [parsed.data, cfg.provider, cfg.model]);
  const cached = await getCachedImage(cacheKey);
  if (cached) {
    logAiCall({ task: "concepts", provider: cfg.provider, model: cfg.model, ok: true, cached: true, latencyMs: 0 });
    return NextResponse.json({ image: cached });
  }

  const prompt = buildModulairPromptFr(parsed.data as ModulairSelection);
  const result = await generateImage({ prompt, size: "1024x1024" }, "concepts");
  if (!result.ok) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const url = await persistAndCache(cacheKey, "modulair", cfg.provider, result.dataUrl);
  return NextResponse.json({ image: url });
}
