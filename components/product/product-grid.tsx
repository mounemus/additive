import { ProductCard } from "@/components/product/product-card";
import { Stagger, StaggerItem } from "@/components/motion/fade-in";
import type { CatalogProduct } from "@/lib/catalog";

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  if (!products.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">
        Aucun modèle ne correspond à ces filtres pour le moment.
      </p>
    );
  }
  return (
    <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <StaggerItem key={p.slug}>
          <ProductCard product={p} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
