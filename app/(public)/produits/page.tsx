import { Suspense } from "react";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { getCollections, getProducts } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

// ISR : contenu servi en cache et régénéré au plus toutes les 5 min
// (les mutations admin déclenchent une revalidation immédiate).
export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Tous les modèles",
  description:
    "Découvrez toutes les montures ADDITIVE : lunettes imprimées en 3D en nylon PA12, personnalisables et fabriquées à la demande à Montréal. Filtrez par collection et par couleur.",
  path: "/produits",
});

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { collection?: string; couleur?: string };
}) {
  const [collections, allProducts] = await Promise.all([
    getCollections(),
    getProducts(),
  ]);

  const filtered = allProducts.filter((p) => {
    if (searchParams.collection && p.collection?.slug !== searchParams.collection)
      return false;
    if (
      searchParams.couleur &&
      !p.colors.some((c) => c.toLowerCase() === searchParams.couleur?.toLowerCase())
    )
      return false;
    return true;
  });

  const allColors = [...new Set(allProducts.flatMap((p) => p.colors))];

  return (
    <>
      <section className="pb-10 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Catalogue</p>
          </FadeIn>
          <AnimatedText
            text="Tous les modèles."
            className="font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted">
              Chaque monture est imprimée à la demande en nylon PA12 et peut
              servir de point de départ à une personnalisation complète.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <Suspense>
            <ProductFilters
              collections={collections.map((c) => ({ slug: c.slug, name: c.name }))}
              colors={allColors}
            />
          </Suspense>
          <div className="mt-8">
            <ProductGrid products={filtered} />
          </div>
        </div>
      </section>
    </>
  );
}
