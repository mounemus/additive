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
import { ProcessSequence } from "@/components/sections/process-sequence";
import { MatterBand } from "@/components/sections/matter-band";
import { CTASection } from "@/components/sections/cta-section";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { Button } from "@/components/ui/button";
import { getCollections, getProducts } from "@/lib/catalog";
import { getMedia } from "@/lib/site-config";
import { EN_CONTENT } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

// ISR : même politique que l'accueil FR (régénération au plus toutes les 5 min).
export const revalidate = 300;

export const metadata = buildMetadata({
  title: "3D-printed, modular, custom eyewear | Montréal",
  description:
    "ADDITIVE — Modular 3D-printed eyewear from Montréal. Frames generated for your face, printed for your style. Parametric design, PA12 nylon, morphological fit.",
  path: "/en",
  locale: "en",
  alternate: "/",
});

export default async function EnglishHomePage() {
  const [collections, featured, media] = await Promise.all([
    getCollections(),
    getProducts({ featuredOnly: true }),
    getMedia(),
  ]);

  return (
    <>
      {/* 1. Hero cinématique — copie éditoriale EN (lib/i18n.ts) */}
      <HeroSection
        content={EN_CONTENT.hero}
        videoSrc={media.heroVideo}
        posterSrc={media.heroPoster}
        locale="en"
      />

      {/* Marquee technique resserré — specs réelles, pause au survol */}
      <Marquee
        items={[
          "PA12 nylon · SLS",
          "≈ 18 g on the nose",
          "3D-printed in Montréal",
          "Parametric design",
          "Morphological fit",
          "Made on demand",
        ]}
      />

      {/* 2. Fil rouge 3D piloté au scroll — narration 01→06 (face → wear) */}
      <ScrollThread modelUrl={media.scrollModel} locale="en" />

      {/* 3. Positionnement — « Your face was never standard » */}
      <ManifestoBand locale="en" />

      {/* 4. Modularité MODUL'AIR — vue éclatée annotée + assemblage */}
      <ModulairSection videoSrc={media.modulairVideo} locale="en" />

      {/* 5. Découverte produit : collections + silhouettes vedettes */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <FadeIn>
                <p className="eyebrow mb-4">Collections</p>
              </FadeIn>
              <AnimatedText
                text="Three languages, one material."
                className="font-display text-display-md font-bold"
              />
            </div>
            <FadeIn delay={0.2} className="hidden sm:block">
              <Link href="/en/collections">
                <Button variant="outline" className="gap-2">
                  All the collections <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </FadeIn>
          </div>
          <CollectionsShowcase collections={collections} locale="en" />

          <div className="mb-10 mt-16 flex items-end justify-between gap-6">
            <div>
              <FadeIn>
                <p className="eyebrow mb-4">Featured models</p>
              </FadeIn>
              <AnimatedText
                text="The signature silhouettes."
                className="font-display text-display-md font-bold"
              />
            </div>
            <FadeIn delay={0.2} className="hidden sm:block">
              <Link href="/en/collections">
                <Button variant="outline" className="gap-2">
                  Browse the models <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </FadeIn>
          </div>
          <ProductGrid products={featured} locale="en" />
        </div>
      </section>

      {/* 6. Comment c'est fait — SCAN → DESIGN → PRINT → FINISH → WEAR */}
      <ProcessSequence videoSrc={media.processVideo} locale="en" />

      {/* 7. La matière — nylon PA12 : couches, macro, compteurs */}
      <MatterBand locale="en" />

      {/* 8. La technologie */}
      <TechnologySection content={EN_CONTENT.technology} compact locale="en" />

      {/* 9. Personnalisation — le parcours, juste avant la conversion */}
      <CustomizationSteps compact locale="en" />

      {/* 10. CTA final — ancrage sombre + monture 3D éclatée en arrière-plan */}
      <CTASection
        title={EN_CONTENT.cta.title}
        button={EN_CONTENT.cta.button}
        modelUrl={media.scrollModel}
        withExploded3D
      />
    </>
  );
}
