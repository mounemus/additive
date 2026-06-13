import { NextResponse } from "next/server";
import { modulairSelectionSchema } from "@/lib/validations";
import { computeModulairPrice, type ModulairSelection } from "@/lib/modulair";

/** Devis MODUL'AIR — calculé côté serveur (le client n'affiche jamais son propre prix). */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = modulairSelectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });
  return NextResponse.json(computeModulairPrice(parsed.data as ModulairSelection));
}
