import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requestStatusSchema } from "@/lib/validations";

/**
 * Mise à jour du statut / de la note interne d'une demande.
 * `?kind=contact` (défaut) ou `?kind=customization`.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const kind = new URL(req.url).searchParams.get("kind") ?? "contact";
  const parsed = requestStatusSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation" }, { status: 422 });

  const data = { status: parsed.data.status, note: parsed.data.note || null };

  try {
    if (kind === "customization") {
      await db.customizationRequest.update({ where: { id: params.id }, data });
    } else {
      await db.contactRequest.update({ where: { id: params.id }, data });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
