import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { providersAdminSchema } from "@/lib/validations";
import { saveProvidersConfig, getProvidersStatus } from "@/lib/configurator-settings";
import { logAudit } from "@/lib/audit";

export async function PUT(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = providersAdminSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  try {
    await saveProvidersConfig(parsed.data);
    // Détail SANS les clés : uniquement les champs touchés.
    logAudit("update", "ProvidersConfig", undefined, Object.keys(parsed.data).join(", "));
    // Renvoie le statut SÛR (sans clés en clair) pour rafraîchir l'UI.
    return NextResponse.json({ ok: true, status: await getProvidersStatus() });
  } catch (e) {
    console.error("[admin/providers] save error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
