import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

/**
 * Passerelle WordPress (plugin « Additive — Passerelle Vercel »).
 *
 * GET   → commandes (CustomizationRequest) + messages de contact récents + stats.
 * PATCH → statut/note modifiés depuis WordPress, répercutés ici.
 *
 * Auth : `Authorization: Bearer <WP_SYNC_SECRET>`. Sans secret configuré,
 * la passerelle est fermée.
 */
export const dynamic = "force-dynamic";

// ponytail: renvoie les 200 derniers de chaque type à chaque sync (WP dédoublonne) ;
// ajouter un curseur `since` + updatedAt si le volume dépasse quelques centaines/jour.
const LIMIT = 200;

function authorized(req: Request): boolean {
  const secret = process.env.WP_SYNC_SECRET;
  if (!secret) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [orders, contacts, products, collections] = await Promise.all([
    db.customizationRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      // photoToken exclu : la photo client ne quitte jamais la plateforme.
      select: {
        id: true, name: true, email: true, phone: true, faceShape: true,
        measurements: true, styleTags: true, boldness: true, conceptLabel: true,
        conceptSummary: true, matchRate: true, moodboardUrl: true, options: true,
        estimatedPrice: true, currency: true, message: true, status: true,
        note: true, createdAt: true,
      },
    }),
    db.contactRequest.findMany({ orderBy: { createdAt: "desc" }, take: LIMIT }),
    db.product.count(),
    db.collection.count(),
  ]);

  return NextResponse.json({ orders, contacts, stats: { products, collections } });
}

const patchSchema = z.object({
  kind: z.enum(["order", "contact"]),
  id: z.string().min(1).max(64),
  status: z.enum(["new", "in_progress", "answered", "archived", "pending_payment", "paid"]),
  note: z.string().max(2000).optional(),
});

export async function PATCH(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  const { kind, id, status, note } = parsed.data;
  const data = note === undefined ? { status } : { status, note };
  try {
    if (kind === "order") await db.customizationRequest.update({ where: { id }, data });
    else await db.contactRequest.update({ where: { id }, data });
    logAudit("update", kind === "order" ? "CustomizationRequest" : "ContactRequest", id, `WordPress → statut: ${status}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
