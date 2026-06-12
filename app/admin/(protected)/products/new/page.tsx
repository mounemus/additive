import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const collections = await safeQuery(
    () =>
      db.collection.findMany({
        orderBy: { order: "asc" },
        select: { id: true, name: true },
      }),
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Nouveau produit</h1>
        <p className="mt-1 text-sm text-muted">
          Le produit reste en brouillon tant qu’il n’est pas publié.
        </p>
      </div>
      <ProductForm collections={collections} />
    </div>
  );
}
