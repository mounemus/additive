import { NextResponse } from "next/server";
import { tempPhotoSchema } from "@/lib/validations";
import { storeTempPhoto, deleteTempPhoto } from "@/lib/temp-photo";

/**
 * Stockage TEMPORAIRE d'une image (capture, snapshot d'essayage, portrait),
 * uniquement quand le client choisit de la joindre à sa demande.
 * Renvoie un token ; la suppression « Supprimer ma photo » se fait par DELETE.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = tempPhotoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const token = await storeTempPhoto(parsed.data.dataUrl, parsed.data.kind);
  if (!token) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  return NextResponse.json({ ok: true, token }, { status: 201 });
}

export async function DELETE(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });
  await deleteTempPhoto(token);
  // Toujours 200 : « supprimée » est l'état attendu côté client.
  return NextResponse.json({ ok: true });
}
