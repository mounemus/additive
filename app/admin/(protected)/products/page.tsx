import Link from "next/link";
import Image from "next/image";
import { Plus, Star } from "lucide-react";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, EmptyRow } from "@/components/admin/data-table";
import { RowActions } from "@/components/admin/row-actions";
import { StatusBadge } from "@/components/admin/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await safeQuery(
    () =>
      db.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          collection: { select: { name: true } },
          images: { orderBy: { order: "asc" }, take: 1 },
        },
      }),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Produits</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} produit{products.length > 1 ? "s" : ""} au catalogue.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nouveau produit
          </Button>
        </Link>
      </div>

      <DataTable headers={["Produit", "Collection", "Prix", "Statut", ""]}>
        {products.length === 0 ? (
          <EmptyRow
            colSpan={5}
            message="Aucun produit. Lancez `npm run db:seed` pour importer le catalogue, ou créez votre premier produit."
          />
        ) : (
          products.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-foreground/[0.02]">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
                    {p.images[0] && (
                      <Image
                        src={p.images[0].url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 font-medium">
                      {p.name}
                      {p.isFeatured && (
                        <Star className="h-3.5 w-3.5 fill-accent-orange text-accent-orange" />
                      )}
                    </p>
                    <p className="text-xs text-muted">/{p.slug}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3">
                {p.collection ? (
                  <Badge variant="outline">{p.collection.name}</Badge>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                {formatPrice(p.price, p.currency)}
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={p.isPublished ? "published" : "draft"} />
              </td>
              <td className="px-5 py-3">
                <RowActions
                  id={p.id}
                  resource="products"
                  isPublished={p.isPublished}
                  editHref={`/admin/products/${p.id}/edit`}
                  deleteLabel={`le produit « ${p.name} »`}
                />
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
