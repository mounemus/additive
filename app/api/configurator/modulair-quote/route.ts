import { NextResponse } from "next/server";
import { modulairSelectionSchema } from "@/lib/validations";
import { computeModulairPrice, type ModulairSelection } from "@/lib/modulair";
import { getModulairConfig } from "@/lib/modulair-settings";

/** Devis MODUL'AIR — calculé côté serveur depuis la config admin. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = modulairSelectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });
  const cfg = await getModulairConfig();
  return NextResponse.json(computeModulairPrice(parsed.data as ModulairSelection, cfg));
}
