import { MapPin, Factory, Users, Store } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { RevealImage } from "@/components/motion/reveal-image";
import { CTASection } from "@/components/sections/cta-section";
import { getContent } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "À propos — Une startup eyewear montréalaise",
  description:
    "ADDITIVE est une startup canadienne de lunetterie additive basée à Montréal. Design modulaire, impression 3D, personnalisation morphologique et production responsable.",
  path: "/about",
});

const VALUES = [
  {
    icon: MapPin,
    title: "Montréal, atelier et port d’attache",
    body: "Conception, prototypage et production à la demande au Québec : circuits courts, contrôle qualité direct et savoir-faire local.",
  },
  {
    icon: Factory,
    title: "Fabrication additive",
    body: "L’impression 3D SLS n’est pas un gadget marketing : c’est ce qui rend possible la modularité, la personnalisation et la production sans stock.",
  },
  {
    icon: Users,
    title: "L’humain au centre",
    body: "Morphologie, style, personnalité : la technologie sert l’ajustement à la personne, jamais l’inverse.",
  },
  {
    icon: Store,
    title: "Un réseau qui grandit",
    body: "Opticiens, concept stores et détaillants : nous construisons un réseau de partenaires qui partagent notre exigence. Parlons-en.",
  },
];

export default async function AboutPage() {
  const brand = await getContent<{ positioning: string; taglineFr: string }>(
    "brand"
  );

  return (
    <>
      <section className="pb-12 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">À propos</p>
          </FadeIn>
          <AnimatedText
            text="Une lunetterie née de l’imprimante, élevée à Montréal."
            className="max-w-4xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {brand.positioning}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          <RevealImage
            src="/images/collections/hybride.svg"
            alt="Atelier ADDITIVE — fabrication additive à Montréal"
            className="aspect-[16/7] rounded-3xl"
            sizes="(max-width: 1320px) 100vw, 1320px"
          />
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <Stagger className="grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <StaggerItem key={v.title}>
                <div className="h-full rounded-2xl border border-border bg-surface p-8">
                  <v.icon className="h-6 w-6 text-accent-blue" />
                  <h2 className="mt-4 font-display text-xl font-semibold">
                    {v.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted">{v.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CTASection
        title="Détaillant, presse ou simplement curieux ? Écrivez-nous."
        button="Nous contacter"
        href="/contact"
      />
    </>
  );
}
