import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { DataTable, EmptyRow } from "@/components/admin/data-table";
import { RowActions } from "@/components/admin/row-actions";
import { StatusBadge } from "@/components/admin/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await safeQuery(
    () =>
      db.collection.findMany({
        orderBy: { order: "asc" },
        include: { _count: { select: { products: true } } },
      }),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Collections</h1>
          <p className="mt-1 text-sm text-muted">
            Ordre, statut et contenus des collections du catalogue.
          </p>
        </div>
        <Link href="/admin/collections/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nouvelle collection
          </Button>
        </Link>
      </div>

      <DataTable headers={["Collection", "Produits", "Ordre", "Statut", ""]}>
        {collections.length === 0 ? (
          <EmptyRow
            colSpan={5}
            message="Aucune collection. Lancez `npm run db:seed` ou créez-en une."
          />
        ) : (
          collections.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-foreground/[0.02]">
              <td className="px-5 py-3">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted">/{c.slug}</p>
              </td>
              <td className="px-5 py-3">{c._count.products}</td>
              <td className="px-5 py-3">{c.order}</td>
              <td className="px-5 py-3">
                <StatusBadge status={c.isPublished ? "published" : "draft"} />
              </td>
              <td className="px-5 py-3">
                <RowActions
                  id={c.id}
                  resource="collections"
                  isPublished={c.isPublished}
                  editHref={`/admin/collections/${c.id}/edit`}
                  deleteLabel={`la collection « ${c.name} »`}
                />
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
