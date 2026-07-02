import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { ModulairConfigurator } from "@/components/configurator/modulair-configurator";
import { CTASection } from "@/components/sections/cta-section";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Moduler mes lunettes — MODUL’AIR",
  description:
    "Composez votre monture MODUL’AIR : forme de face, couleurs, branches interchangeables, verres et finitions. Aperçu en direct, essayage AR et portrait porté. Lunettes modulaires imprimées en 3D, Montréal.",
  path: "/personnalisation/modulair",
});

const PILLARS = [
  "Face avant, branches et verres interchangeables",
  "Assemblages bicolores et combinaisons illimitées",
  "Réparez ou faites évoluer un module sans racheter la paire",
  "Nylon PA12 imprimé en 3D, à la demande",
];

export default function ModulairPage() {
  return (
    <>
      <section className="pb-8 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">MODUL’AIR — système modulaire</p>
          </FadeIn>
          <AnimatedText text="Moduler mes lunettes." className="font-display text-display-lg font-bold" />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Votre monture ne se choisit plus. Elle se configure. Composez un
              assemblage de composants imprimés en 3D et compatibles entre eux —
              face × branches × couleurs × verres × finition — puis essayez-le en
              réalité augmentée.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((p) => (
                <div key={p} className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
                  {p}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          <ModulairConfigurator />
        </div>
      </section>

      <CTASection
        title="Une face avant, mille montures. Faites évoluer la vôtre."
        button="Explorer les collections"
        href="/collections"
      />
    </>
  );
}
