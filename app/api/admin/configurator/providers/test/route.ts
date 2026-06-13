import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { providerTestSchema } from "@/lib/validations";
import { testProviderKey } from "@/lib/ai/image-provider";
import { getProviderKey } from "@/lib/configurator-settings";

/**
 * Teste une clé de fournisseur en un clic (badge de statut en direct).
 * Accepte une clé fournie dans la requête, ou teste la clé déjà enregistrée
 * (valeur masquée "••••" → on relit la vraie clé côté serveur).
 */
export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = providerTestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  let key = parsed.data.key;
  // Clé masquée → utiliser la clé enregistrée.
  if (/^[•*]+/.test(key)) {
    const stored = await getProviderKey(parsed.data.providerId);
    if (!stored) return NextResponse.json({ ok: false, detail: "aucune clé enregistrée" });
    key = stored;
  }

  const result = await testProviderKey(parsed.data.providerId, key);
  return NextResponse.json(result);
}
