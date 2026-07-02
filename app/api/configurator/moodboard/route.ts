import { NextResponse } from "next/server";
import { moodboardGenSchema } from "@/lib/validations";
import {
  buildMoodboardPromptFr,
  profilePalette,
  type StyleTag,
  type FaceShape,
} from "@/lib/configurator";
import { generateImage } from "@/lib/ai/image-provider";
import { demoMoodboardSvg } from "@/lib/ai/demo-visuals";
import { guard, RULES } from "@/lib/rate-limit";

// Génération d'image : durée bornée explicitement (plan Vercel Pro).
export const maxDuration = 60;

/**
 * Génère le moodboard éditorial. Si un fournisseur d'IA est configuré, il
 * produit une vraie planche d'ambiance ; sinon, repli SVG cohérent avec la
 * palette du profil (croquis d'intention assumé). Le client ne sait jamais
 * quel chemin a été pris — il reçoit simplement une image et un drapeau `ai`.
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

  const parsed = moodboardGenSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const styleTags = parsed.data.styleTags as StyleTag[];
  const faceShape = (parsed.data.faceShape as FaceShape) ?? null;
  const palette = profilePalette(styleTags);

  const prompt = buildMoodboardPromptFr(styleTags, faceShape);
  const result = await generateImage({ prompt, size: "1536x1024" }, "moodboard");

  if (result.ok) {
    return NextResponse.json({
      ai: true,
      image: result.dataUrl,
      palette: { name: palette.name, colors: palette.colors, material: palette.material },
    });
  }

  // Repli démo (jamais d'erreur visible au client pour ce visuel).
  return NextResponse.json({
    ai: false,
    image: demoMoodboardSvg(palette.colors, palette.material),
    palette: { name: palette.name, colors: palette.colors, material: palette.material },
  });
}
