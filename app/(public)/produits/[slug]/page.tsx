import { notFound } from "next/navigation";
import { Sparkles, Feather, ShieldCheck, Leaf } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetails } from "@/components/product/product-details";
import { Model3DViewer } from "@/components/product/model-3d-viewer";
import { ModulairExplodedCompact } from "@/components/configurator/modulair-exploded-compact";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { CTASection } from "@/components/sections/cta-section";
import { getProduct, getRelatedProducts } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const WHY_POINTS = [
  {
    icon: Feather,
    title: "Légèreté réelle",
    body: "Environ 18 g sur le nez : le nylon PA12 fritté permet d’alléger la structure sans la fragiliser.",
  },
  {
    icon: ShieldCheck,
    title: "Robustesse mémoire",
    body: "Flexible et doté d’une excellente mémoire de forme, il retrouve sa géométrie après torsion.",
  },
  {
    icon: Sparkles,
    title: "Personnalisable",
    body: "Cette monture peut servir de base à une personnalisation complète : forme, couleur, branches, verres.",
  },
  {
    icon: Leaf,
    title: "Produite à la demande",
    body: "Aucun stock, aucun invendu : votre paire est imprimée après votre commande, à Montréal.",
  },
];

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return buildMetadata({ title: "Modèle" });
  return buildMetadata({
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    path: `/produits/${product.slug}`,
    image: product.image,
  });
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <>
      <section className="pb-20 pt-32 md:pt-40">
        <div className="container grid gap-12 lg:grid-cols-[1.15fr_1fr]">
          <FadeIn y={16}>
            <ProductGallery images={product.images} name={product.name} />
          </FadeIn>
          <FadeIn y={16} delay={0.1}>
            <ProductDetails product={product} />
          </FadeIn>
        </div>
      </section>

      {product.model3dUrl && (
        <section className="border-t border-border py-16">
          <div className="container">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-display-md font-bold">Vue 3D</h2>
              <p className="text-sm text-muted">Faites pivoter, zoomez, explorez la monture sous tous les angles.</p>
            </div>
            <Model3DViewer
              src={product.model3dUrl}
              alt={`${product.name} — modèle 3D`}
              poster={product.image}
              className="aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border"
            />
          </div>
        </section>
      )}

      {product.description && (
        <section className="border-t border-border py-20">
          <div className="container grid gap-10 lg:grid-cols-[1fr_1.5fr]">
            <h2 className="font-display text-display-md font-bold">
              L’histoire du design
            </h2>
            <FadeIn>
              <p className="text-lg leading-relaxed text-muted">
                {product.description}
              </p>
            </FadeIn>
          </div>
        </section>
      )}

      {product.collection?.slug === "modulair" && (
        <section className="border-t border-border py-16 md:py-20">
          <div className="container grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="eyebrow mb-3">Système modulaire</p>
              <h2 className="font-display text-display-md font-bold">Une monture qui se compose.</h2>
              <p className="mt-4 leading-relaxed text-muted">
                {product.name} appartient à MODUL’AIR : face, branches et verres
                sont interchangeables. Réparez, faites évoluer ou recolorez un
                module sans racheter la paire.
              </p>
              <Link href="/personnalisation/modulair" className="mt-7 inline-block">
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" /> Moduler cette base
                </Button>
              </Link>
            </div>
            <ModulairExplodedCompact className="text-foreground" />
          </div>
        </section>
      )}

      <section className="section-dark py-20 md:py-28">
        <div className="container">
          <AnimatedText
            text="Pourquoi cette monture ?"
            className="font-display text-display-md font-bold"
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {WHY_POINTS.map((point) => (
              <div key={point.title} className="bg-surface p-7">
                <point.icon className="h-6 w-6 text-accent-blue" />
                <h3 className="mt-4 font-display font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container">
            <h2 className="mb-10 font-display text-display-md font-bold">
              Vous aimerez aussi
            </h2>
            <ProductGrid products={related} />
          </div>
        </section>
      )}

      <CTASection
        title={`Faites de ${product.name} votre point de départ.`}
        button="Personnaliser ce modèle"
        href={`/personnalisation?base=${product.slug}`}
      />
    </>
  );
}
