import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/sections/hero-section";
import { Marquee } from "@/components/sections/marquee";
import { CollectionCard } from "@/components/product/collection-card";
import { ProductGrid } from "@/components/product/product-grid";
import { CustomizationSteps } from "@/components/sections/customization-steps";
import { TechnologySection } from "@/components/sections/technology-section";
import { ManifestoBand } from "@/components/sections/manifesto-band";
import { ScrollThread } from "@/components/sections/scroll-thread";
// ManifestoSection vit désormais sur /manifeste (retiré de l'accueil pour éviter le doublon éditorial)
import { ProcessSequence } from "@/components/sections/process-sequence";
import { MatterBand } from "@/components/sections/matter-band";
import { CTASection } from "@/components/sections/cta-section";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { Button } from "@/components/ui/button";
import { getCollections, getProducts, getContent } from "@/lib/catalog";
import { getMedia } from "@/lib/site-config";

// ISR : contenu servi en cache et régénéré au plus toutes les 5 min
// (les mutations admin déclenchent une revalidation immédiate).
export const revalidate = 300;

export default async function HomePage() {
  const [hero, technology, cta, collections, featured, media] =
    await Promise.all([
      getContent<{
        eyebrow: string;
        title: string;
        subtitle: string;
        ctaPrimary: string;
        ctaSecondary: string;
      }>("hero"),
      getContent<{ title: string; intro: string; blocks: { title: string; body: string }[] }>(
        "technology"
      ),
      getContent<{ title: string; button: string }>("cta"),
      getCollections(),
      getProducts({ featuredOnly: true }),
      getMedia(),
    ]);

  return (
    <>
      {/* 1. Hero cinématique */}
      <HeroSection content={hero} videoSrc={media.heroVideo} posterSrc={media.heroPoster} />

      <Marquee
        items={[
          "Imprimées en 3D à Montréal",
          "Nylon PA12 — 18 g",
          "Design paramétrique",
          "Production à la demande",
          "Montures modulaires",
        ]}
      />

      {/* 2. Fil rouge 3D piloté au scroll — la pièce maîtresse (conception → identité) */}
      <ScrollThread modelUrl={media.scrollModel} />

      {/* 3. Positionnement — « Votre visage n'est pas standard » */}
      <ManifestoBand />

      {/* 4. Découverte produit : collections + silhouettes vedettes (un même bloc) */}
      <section className="py-14 md:py-20">
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

          <div className="mb-10 mt-20 flex items-end justify-between gap-6">
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

      {/* 5. Comment c'est fait — ancrage sombre (SCAN → DESIGN → PRINT → FINISH → WEAR) */}
      <ProcessSequence videoSrc={media.processVideo} />

      {/* 6. La matière — nylon PA12, faits vérifiables */}
      <MatterBand />

      {/* 7. La technologie */}
      <TechnologySection content={technology} compact />

      {/* 8. Personnalisation — le parcours, juste avant la conversion */}
      <CustomizationSteps compact />

      {/* 9. CTA final — ancrage sombre + monture 3D éclatée en arrière-plan */}
      <CTASection title={cta.title} button={cta.button} modelUrl={media.scrollModel} withExploded3D />
    </>
  );
}
