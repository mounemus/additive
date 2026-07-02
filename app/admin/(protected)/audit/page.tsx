import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Journal d'audit : les 50 dernières actions admin (mutations back-office).
 * Lecture seule — les entrées sont écrites en fire-and-forget par lib/audit.
 */
export default async function AuditPage() {
  const logs = await safeQuery(
    () => db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    []
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Journal</h1>
        <p className="mt-1 text-sm text-muted">
          Les 50 dernières actions effectuées dans le back-office.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dernières actions</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted">Aucune action enregistrée pour l&rsquo;instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Utilisateur</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Entité</th>
                    <th className="py-2">Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="whitespace-nowrap py-2 pr-4 tabular-nums text-muted">
                        {log.createdAt.toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-2 pr-4">{log.userEmail}</td>
                      <td className="py-2 pr-4 font-medium">{log.action}</td>
                      <td className="py-2 pr-4">
                        {log.entity}
                        {log.entityId ? (
                          <span className="ml-1 text-xs text-muted">#{log.entityId}</span>
                        ) : null}
                      </td>
                      <td className="max-w-[280px] truncate py-2 text-xs text-muted">
                        {log.detail ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
