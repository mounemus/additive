import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import {
  buildFrameOverlayPromptFr,
  buildConcepts,
  conceptByLabel,
  type StyleTag,
} from "@/lib/configurator";
import { generateFrameOverlay, toDataUrl } from "@/lib/ai/image-provider";
import { guard, RULES } from "@/lib/rate-limit";
import { makeCacheKey, getCachedImage, persistAndCache, logAiCall } from "@/lib/ai/image-store";

// Génération d'image : durée bornée explicitement.
export const maxDuration = 60;

const schema = z.object({
  conceptLabel: z.string().max(120),
  styleTags: z.array(z.string().max(40)).max(8).default([]),
  conceptImage: z.string().max(8_000_000).optional(),
  conceptSummary: z.string().max(2000).optional(),
  // Fiche produit : couleurs/matières réelles injectées dans le prompt.
  colors: z.array(z.string().max(60)).max(10).default([]),
  materials: z.array(z.string().max(60)).max(10).default([]),
});

/**
 * Façade transparente du concept pour l'essayage AR (superposée et ancrée aux
 * landmarks côté client). Renvoie l'image + le fond ('transparent' alpha natif
 * OpenAI, ou 'white' à détourer côté client pour Gemini). Sans IA → 503.
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

  // Référence produit inlinée AVANT le calcul de la clé de cache : le hash
  // porte sur le CONTENU de l'image (image produit changée sous la même URL
  // = overlay régénéré). Log SERVEUR uniquement du chemin pris.
  const rawRef = parsed.data.conceptImage;
  let conceptImage: string | undefined;
  if (rawRef) {
    conceptImage = rawRef.startsWith("data:") ? rawRef : ((await toDataUrl(rawRef)) ?? undefined);
    console.info(
      "[frame-overlay] route référence:",
      conceptImage ? "inline OK" : "ÉCHEC fetch (403/timeout ?) → façade générique",
      rawRef.startsWith("data:") ? "(data URL client)" : rawRef.slice(0, 160)
    );
  }
  const refHash = conceptImage
    ? createHash("sha256").update(conceptImage).digest("hex").slice(0, 16)
    : (rawRef ?? "");

  // Cache : même concept + même CONTENU d'image de référence = même façade.
  // Valeur stockée = `<bg>|<url>` (le type de fond doit survivre au cache).
  // "v3" = version du prompt façade (amorces de charnières + départ de
  // branches) : invalide les façades « coupées net » générées avant.
  const cacheKey = makeCacheKey("frameOverlay", [
    "v3",
    parsed.data.conceptLabel,
    [...styleTags].sort(),
    refHash,
    [...parsed.data.colors].sort(),
    [...parsed.data.materials].sort(),
  ]);
  const cached = await getCachedImage(cacheKey);
  if (cached) {
    const sep = cached.indexOf("|");
    if (sep > 0) {
      logAiCall({ task: "frameOverlay", provider: "cache", ok: true, cached: true, latencyMs: 0 });
      const bg = cached.slice(0, sep) === "white" ? "white" : "transparent";
      return NextResponse.json({ image: cached.slice(sep + 1), bg });
    }
  }

  const prompt = buildFrameOverlayPromptFr(concept, styleTags, {
    colors: parsed.data.colors,
    materials: parsed.data.materials,
  });
  const result = await generateFrameOverlay({ prompt, conceptImage });
  if (!result.ok) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  // Persistance CDN (ou data URL en repli), puis mise en cache préfixée du fond.
  const url = await persistAndCache(null, "frameOverlay", undefined, result.dataUrl);
  await persistAndCache(cacheKey, "frameOverlay", undefined, `${result.bg}|${url}`);

  return NextResponse.json({ image: url, bg: result.bg });
}
