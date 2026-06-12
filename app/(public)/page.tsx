import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/sections/hero-section";
import { Marquee } from "@/components/sections/marquee";
import { CollectionCard } from "@/components/product/collection-card";
import { ProductGrid } from "@/components/product/product-grid";
import { CustomizationSteps } from "@/components/sections/customization-steps";
import { TechnologySection } from "@/components/sections/technology-section";
import { ManifestoSection } from "@/components/sections/manifesto-section";
import { CTASection } from "@/components/sections/cta-section";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { Button } from "@/components/ui/button";
import { getCollections, getProducts, getContent } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [hero, brand, technology, cta, collections, featured] =
    await Promise.all([
      getContent<{
        eyebrow: string;
        title: string;
        subtitle: string;
        ctaPrimary: string;
        ctaSecondary: string;
      }>("hero"),
      getContent<{ positioning: string; taglineFr: string }>("brand"),
      getContent<{ title: string; intro: string; blocks: { title: string; body: string }[] }>(
        "technology"
      ),
      getContent<{ title: string; button: string }>("cta"),
      getCollections(),
      getProducts({ featuredOnly: true }),
    ]);

  return (
    <>
      {/* 1. Hero cinématique */}
      <HeroSection content={hero} />

      <Marquee
        items={[
          "Imprimées en 3D à Montréal",
          "Nylon PA12 — 18 g",
          "Design paramétrique",
          "Production à la demande",
          "Montures modulaires",
        ]}
      />

      {/* 2. Présentation de la marque */}
      <section className="py-24 md:py-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">La marque</p>
          </FadeIn>
          <AnimatedText
            text={brand.taglineFr}
            className="max-w-4xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.25}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">
              {brand.positioning}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* 3. Collections principales */}
      <section className="pb-24 md:pb-32">
        <div className="container">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <FadeIn>
                <p className="eyebrow mb-4">Collections</p>
              </FadeIn>
              <AnimatedText
                text="Trois langages, une même matière."
                className="font-display text-display-md font-bold"
              />
            </div>
            <FadeIn delay={0.2} className="hidden sm:block">
              <Link href="/collections">
                <Button variant="outline" className="gap-2">
                  Toutes les collections <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </FadeIn>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {collections.map((c, i) => (
              <CollectionCard key={c.slug} collection={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Bloc personnalisation */}
      <CustomizationSteps compact />

      {/* 5. Technologie */}
      <TechnologySection content={technology} compact />

      {/* 6. Produits vedettes */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <FadeIn>
                <p className="eyebrow mb-4">Modèles vedettes</p>
              </FadeIn>
              <AnimatedText
                text="Les silhouettes signature."
                className="font-display text-display-md font-bold"
              />
            </div>
            <FadeIn delay={0.2} className="hidden sm:block">
              <Link href="/produits">
                <Button variant="outline" className="gap-2">
                  Voir les modèles <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </FadeIn>
          </div>
          <ProductGrid products={featured} />
        </div>
      </section>

      {/* 7. Expérience de marque (éditorial) */}
      <ManifestoSection />

      {/* 8. CTA final */}
      <CTASection title={cta.title} button={cta.button} />
    </>
  );
}
