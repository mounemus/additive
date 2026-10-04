import { withBase } from "@/lib/base-path";
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

// ISR : même politique que /collections/[slug] (5 min).
export const revalidate = 300;

/**
 * Piliers éditoriaux EN par collection. Les noms de collections (MODUL'AIR,
 * GENERATIVE, HYBRIDE), taglines et descriptions DB restent tels quels
 * (noms et voix de marque) ; seul le chrome autour est traduit.
 */
const COLLECTION_PILLARS: Record<string, string[]> = {
  modulair: [
    "Interchangeable fronts, temples and lenses",
    "Unlimited combinations and upgrades",
    "Repair instead of replace",
    "Fast personalization in the workshop",
  ],
  generative: [
    "Geometries born from generative design and AI",
    "Sculptural, distinctive silhouettes",
    "Structures impossible to mould",
    "Human design × algorithm co-creation",
  ],
  hybride: [
    "Additive manufacturing + artisanal finishing",
    "Contrasting materials and premium details",
    "Quiet sophistication",
    "Innovation in the service of the material",
  ],
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  if (!collection) return buildMetadata({ title: "Collection", locale: "en" });
  return buildMetadata({
    title: `${collection.name} — 3D-printed eyewear collection`,
    description: collection.seoDescription ?? collection.description ?? undefined,
    path: `/en/collections/${collection.slug}`,
    locale: "en",
    alternate: `/collections/${collection.slug}`,
  });
}

export default async function EnglishCollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  const products = await getProducts({ collectionSlug: collection.slug, locale: "en" });
  const pillars = COLLECTION_PILLARS[collection.slug] ?? [];

  return (
    <>
      <section className="pb-12 pt-28 md:pt-32">
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
              src={withBase(collection.image)}
              alt={`${collection.name} collection`}
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
                  <p className="eyebrow mb-2">Modular system</p>
                  <h2 className="font-display text-display-md font-bold">Modulate my glasses</h2>
                  <p className="mt-3 max-w-xl text-muted">
                    Compose your frame piece by piece — front, temples,
                    colours, lenses, finish — with live preview, AR try-on
                    and a worn portrait.
                  </p>
                </div>
                <Link href="/personnalisation/modulair">
                  <Button variant="light" size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Open the configurator
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
              The models
            </h2>
            <Link href="/personnalisation" className="hidden sm:block">
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" /> Customize
              </Button>
            </Link>
          </div>
          <ProductGrid products={products} locale="en" />
        </div>
      </section>

      <CTASection
        title="Start from this collection. Arrive at your own frame."
        button="Start customizing"
      />
    </>
  );
}
