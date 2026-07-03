import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/sections/hero-section";
import { Marquee } from "@/components/sections/marquee";
import { CollectionsShowcase } from "@/components/sections/collections-showcase";
import { ModulairSection } from "@/components/sections/modulair-section";
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
import { buildMetadata } from "@/lib/seo";

// ISR : contenu servi en cache et régénéré au plus toutes les 5 min
// (les mutations admin déclenchent une revalidation immédiate).
export const revalidate = 300;

// Titre/description par défaut (inchangés) + hreflang vers l'accueil EN.
export const metadata = buildMetadata({ path: "/", alternate: "/en" });

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

      {/* Marquee technique resserré — specs réelles, pause au survol */}
      <Marquee
        items={[
          "Nylon PA12 · SLS",
          "≈ 18 g sur le nez",
          "Imprimées en 3D à Montréal",
          "Design paramétrique",
          "Sur-mesure morphologique",
          "Production à la demande",
        ]}
      />

      {/* 2. Fil rouge 3D piloté au scroll — narration 01→06 (visage → port) */}
      <ScrollThread modelUrl={media.scrollModel} />

      {/* 3. Positionnement — « Votre visage n'est pas standard » */}
      <ManifestoBand />

      {/* 4. Modularité MODUL'AIR — vue éclatée annotée + assemblage */}
      <ModulairSection videoSrc={media.modulairVideo} />

      {/* 5. Découverte produit : collections + silhouettes vedettes (un même bloc) */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mb-10 flex items-end justify-between gap-6">
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
          <CollectionsShowcase collections={collections} />

          <div className="mb-10 mt-16 flex items-end justify-between gap-6">
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

      {/* 6. Comment c'est fait — ancrage sombre (SCAN → DESIGN → PRINT → FINISH → WEAR) */}
      <ProcessSequence videoSrc={media.processVideo} />

      {/* 7. La matière — nylon PA12 : couches, macro, compteurs */}
      <MatterBand />

      {/* 8. La technologie */}
      <TechnologySection content={technology} compact />

      {/* 9. Personnalisation — le parcours, juste avant la conversion */}
      <CustomizationSteps compact />

      {/* 10. CTA final — ancrage sombre + monture 3D éclatée en arrière-plan */}
      <CTASection title={cta.title} button={cta.button} modelUrl={media.scrollModel} withExploded3D />
    </>
  );
}
