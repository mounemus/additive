import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, Check } from "lucide-react";
import { RevealImage } from "@/components/motion/reveal-image";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { ProductGrid } from "@/components/product/product-grid";
import { CTASection } from "@/components/sections/cta-section";
import { ModulairVideoSection } from "@/components/configurator/modulair-video";
import { Button } from "@/components/ui/button";
import { getCollection, getProducts } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const COLLECTION_PILLARS: Record<string, string[]> = {
  modulair: [
    "Faces, branches et verres interchangeables",
    "Combinaisons et évolutions illimitées",
    "Réparation plutôt que remplacement",
    "Personnalisation rapide en atelier",
  ],
  generative: [
    "Géométries issues du design génératif et de l’IA",
    "Silhouettes sculpturales et distinctives",
    "Structures impossibles à mouler",
    "Co-création design humain × algorithme",
  ],
  hybride: [
    "Fabrication additive + finition artisanale",
    "Matériaux contrastés et détails premium",
    "Sophistication discrète",
    "Innovation au service de la matière",
  ],
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  if (!collection) return buildMetadata({ title: "Collection" });
  return buildMetadata({
    title: collection.seoTitle ?? collection.name,
    description: collection.seoDescription ?? collection.description ?? undefined,
    path: `/collections/${collection.slug}`,
  });
}

export default async function CollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  const products = await getProducts({ collectionSlug: collection.slug });
  const pillars = COLLECTION_PILLARS[collection.slug] ?? [];

  return (
    <>
      <section className="pb-16 pt-36 md:pt-44">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Collection</p>
          </FadeIn>
          <AnimatedText
            text={collection.name}
            className="font-display text-display-xl font-bold"
          />
          {collection.tagline && (
            <FadeIn delay={0.15}>
              <p className="mt-4 text-xl text-accent-blue">{collection.tagline}</p>
            </FadeIn>
          )}
          <FadeIn delay={0.25}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {collection.description}
            </p>
          </FadeIn>
        </div>
      </section>

      {collection.image && (
        <section className="pb-20">
          <div className="container">
            <RevealImage
              src={collection.image}
              alt={`Collection ${collection.name}`}
              className="aspect-[16/8] rounded-3xl"
              sizes="(max-width: 1320px) 100vw, 1320px"
              priority
            />
          </div>
        </section>
      )}

      {pillars.length > 0 && (
        <section className="pb-20">
          <div className="container">
            <FadeIn>
              <div className="grid gap-4 rounded-3xl border border-border bg-surface p-8 sm:grid-cols-2 md:p-10">
                {pillars.map((p) => (
                  <div key={p} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent-blue" />
                    <p className="text-sm leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {collection.slug === "modulair" && <ModulairVideoSection />}

      {collection.slug === "modulair" && (
        <section className="pb-20 pt-20">
          <div className="container">
            <FadeIn>
              <div className="section-dark flex flex-col items-start gap-5 rounded-3xl border border-border p-8 md:flex-row md:items-center md:justify-between md:p-12">
                <div>
                  <p className="eyebrow mb-2">Système modulaire</p>
                  <h2 className="font-display text-display-md font-bold">Moduler mes lunettes</h2>
                  <p className="mt-3 max-w-xl text-muted">
                    Composez votre monture pièce par pièce — face, branches,
                    couleurs, verres, finition — avec aperçu en direct, essayage
                    AR et portrait porté.
                  </p>
                </div>
                <Link href="/personnalisation/modulair">
                  <Button variant="light" size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Ouvrir le configurateur
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      <section className="pb-24">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-display text-display-md font-bold">
              Les modèles
            </h2>
            <Link href="/personnalisation" className="hidden sm:block">
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" /> Personnaliser
              </Button>
            </Link>
          </div>
          <ProductGrid products={products} />
        </div>
      </section>

      <CTASection
        title="Partez de cette collection. Arrivez à votre monture."
        button="Commencer la personnalisation"
      />
    </>
  );
}
