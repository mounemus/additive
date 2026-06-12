import Link from "next/link";
import {
  Glasses,
  Layers,
  Inbox,
  Sparkles,
  Plus,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [productCount, publishedCount, collectionCount, contactCount, customCount, dbOk] =
    await Promise.all([
      safeQuery(() => db.product.count(), -1),
      safeQuery(() => db.product.count({ where: { isPublished: true } }), 0),
      safeQuery(() => db.collection.count(), 0),
      safeQuery(() => db.contactRequest.count({ where: { status: "new" } }), 0),
      safeQuery(() => db.customizationRequest.count({ where: { status: "new" } }), 0),
      safeQuery(async () => {
        await db.$queryRaw`SELECT 1`;
        return true;
      }, false),
    ]);

  const latestContacts = await safeQuery(
    () =>
      db.contactRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    []
  );
  const latestCustomizations = await safeQuery(
    () =>
      db.customizationRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    []
  );

  const stats = [
    { label: "Produits", value: Math.max(productCount, 0), icon: Glasses, href: "/admin/products" },
    { label: "Produits publiés", value: publishedCount, icon: Glasses, href: "/admin/products" },
    { label: "Collections", value: collectionCount, icon: Layers, href: "/admin/collections" },
    { label: "Messages à traiter", value: contactCount, icon: Inbox, href: "/admin/contact-requests" },
    { label: "Personnalisations à traiter", value: customCount, icon: Sparkles, href: "/admin/contact-requests" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted">
            Vue d’ensemble du catalogue et des demandes.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/products/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nouveau produit
            </Button>
          </Link>
        </div>
      </div>

      {!dbOk && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">Base de données non connectée.</p>
            <p>
              Configurez <code>DATABASE_URL</code> dans <code>.env</code> puis
              lancez <code>npm run db:push</code> et <code>npm run db:seed</code>.
              Le site public fonctionne en mode démo (contenu statique), mais le
              back-office nécessite une base.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-card-hover">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">{s.label}</p>
                  <p className="mt-1 font-display text-3xl font-bold">{s.value}</p>
                </div>
                <s.icon className="h-7 w-7 text-accent-blue" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Derniers messages</CardTitle>
            <Link
              href="/admin/contact-requests"
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {latestContacts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Aucun message pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {latestContacts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {c.name} <span className="text-muted">· {c.type}</span>
                      </p>
                      <p className="truncate text-xs text-muted">{c.message}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-muted">{formatDate(c.createdAt)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Dernières demandes de personnalisation</CardTitle>
            <Link
              href="/admin/contact-requests?tab=personnalisation"
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {latestCustomizations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Aucune demande pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {latestCustomizations.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {c.name}
                        {c.conceptLabel && (
                          <span className="text-muted"> · « {c.conceptLabel} »</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {c.styleTags.join(", ")}
                        {c.estimatedPrice ? ` — ${c.estimatedPrice} $ CAD` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-muted">{formatDate(c.createdAt)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
