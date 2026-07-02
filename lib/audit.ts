import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Journal d'audit des actions admin — fire-and-forget.
 *
 * Jamais bloquant : l'écriture se fait en arrière-plan et toute erreur
 * (base indisponible, session manquante…) est avalée avec un simple log
 * console. Une mutation ne doit jamais échouer à cause de l'audit.
 */
export function logAudit(
  action: string,
  entity: string,
  entityId?: string,
  detail?: string
): void {
  void (async () => {
    const session = await auth();
    const userEmail = session?.user?.email ?? "unknown";
    await db.auditLog.create({
      data: {
        userEmail,
        action,
        entity,
        entityId: entityId ?? null,
        detail: detail ?? null,
      },
    });
  })().catch((e) => {
    console.error("[audit] écriture impossible:", e);
  });
}
