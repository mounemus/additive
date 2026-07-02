import { Activity, CheckCircle2, XCircle, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Pilotage des coûts IA : volume d'appels par tâche/fournisseur, taux de
 * réussite, part servie par le cache (= économies) et derniers appels.
 * Aucune donnée client ici — uniquement des métriques techniques.
 */
export default async function AiCostsPage() {
  const since30d = new Date(Date.now() - 30 * 24 * 3600_000);
  const since24h = new Date(Date.now() - 24 * 3600_000);

  const [total30d, cached30d, failed30d, total24h, byTask, latest] = await Promise.all([
    safeQuery(() => db.aiCallLog.count({ where: { createdAt: { gte: since30d } } }), 0),
    safeQuery(
      () => db.aiCallLog.count({ where: { createdAt: { gte: since30d }, cached: true } }),
      0
    ),
    safeQuery(
      () => db.aiCallLog.count({ where: { createdAt: { gte: since30d }, ok: false } }),
      0
    ),
    safeQuery(() => db.aiCallLog.count({ where: { createdAt: { gte: since24h } } }), 0),
    safeQuery(
      () =>
        db.aiCallLog.groupBy({
          by: ["task", "provider"],
          where: { createdAt: { gte: since30d } },
          _count: { _all: true },
          _avg: { latencyMs: true },
        }),
      [] as { task: string; provider: string; _count: { _all: number }; _avg: { latencyMs: number | null } }[]
    ),
    safeQuery(
      () => db.aiCallLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      []
    ),
  ]);

  const generated30d = total30d - cached30d;
  const savingsRate = total30d > 0 ? Math.round((cached30d / total30d) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Coûts IA</h1>
        <p className="mt-1 text-sm text-muted">
          Appels aux fournisseurs d&rsquo;images sur 30 jours. Les appels servis par le
          cache ne coûtent rien.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Activity className="h-4 w-4" />} label="Appels (30 j)" value={String(total30d)} />
        <Kpi icon={<Zap className="h-4 w-4" />} label="Servis par le cache" value={`${cached30d} (${savingsRate} %)`} />
        <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Générations payantes" value={String(generated30d)} />
        <Kpi icon={<XCircle className="h-4 w-4" />} label="Échecs / 24 h" value={`${failed30d} / ${total24h}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Par tâche et fournisseur (30 j)</CardTitle>
        </CardHeader>
        <CardContent>
          {byTask.length === 0 ? (
            <p className="text-sm text-muted">Aucun appel enregistré pour l&rsquo;instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-4">Tâche</th>
                    <th className="py-2 pr-4">Fournisseur</th>
                    <th className="py-2 pr-4">Appels</th>
                    <th className="py-2">Latence moy.</th>
                  </tr>
                </thead>
                <tbody>
                  {byTask.map((row) => (
                    <tr key={`${row.task}-${row.provider}`} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">{row.task}</td>
                      <td className="py-2 pr-4">{row.provider}</td>
                      <td className="py-2 pr-4 tabular-nums">{row._count._all}</td>
                      <td className="py-2 tabular-nums">
                        {row._avg.latencyMs ? `${Math.round(row._avg.latencyMs / 100) / 10} s` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Derniers appels</CardTitle>
        </CardHeader>
        <CardContent>
          {latest.length === 0 ? (
            <p className="text-sm text-muted">Aucun appel enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Tâche</th>
                    <th className="py-2 pr-4">Fournisseur</th>
                    <th className="py-2 pr-4">Statut</th>
                    <th className="py-2 pr-4">Latence</th>
                    <th className="py-2">Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="whitespace-nowrap py-2 pr-4 tabular-nums text-muted">
                        {log.createdAt.toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-2 pr-4">{log.task}</td>
                      <td className="py-2 pr-4">{log.provider}{log.model ? ` · ${log.model}` : ""}</td>
                      <td className="py-2 pr-4">
                        {log.cached ? (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">cache</span>
                        ) : log.ok ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">ok</span>
                        ) : (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">échec</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{(log.latencyMs / 1000).toFixed(1)} s</td>
                      <td className="max-w-[280px] truncate py-2 text-xs text-muted">{log.detail ?? ""}</td>
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

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
          {icon} {label}
        </div>
        <p className="mt-2 font-display text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
