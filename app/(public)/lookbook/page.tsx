import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { LookbookGallery } from "@/components/sections/lookbook-gallery";
import { CTASection } from "@/components/sections/cta-section";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Lookbook",
  description:
    "Le lookbook ADDITIVE : formes, matières et couleurs des montures imprimées en 3D. Une galerie éditoriale entre design paramétrique, nylon PA12 et fabrication additive.",
  path: "/lookbook",
});

export default function LookbookPage() {
  return (
    <>
      <section className="pb-10 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Lookbook</p>
          </FadeIn>
          <AnimatedText
            text="Trouvez la forme qui vous ressemble."
            className="max-w-3xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Une galerie des formes, matières et couleurs ADDITIVE — entre
              design paramétrique, nylon PA12 et fabrication additive.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <LookbookGallery />
          <FadeIn delay={0.2}>
            <div className="mt-8 flex justify-center">
              <Link href="/personnalisation">
                <Button size="lg">Créer ma monture</Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <CTASection
        title="Votre prochaine monture commence ici."
        button="Commencer"
      />
    </>
  );
}
