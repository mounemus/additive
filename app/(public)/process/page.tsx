import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { ProcessSequence } from "@/components/sections/process-sequence";
import { CTASection } from "@/components/sections/cta-section";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Le procédé — du visage à l’objet",
  description:
    "Scan, design paramétrique, impression 3D SLS du nylon PA12, finition et montage : le procédé de fabrication additive des lunettes ADDITIVE, étape par étape.",
  path: "/process",
});

const STEPS = [
  { n: "01", label: "Scan", body: "Vos mesures faciales sont captées et calibrées sur des repères anatomiques stables — écart pupillaire, largeur, pont. Le point de départ n’est pas un catalogue, c’est votre visage." },
  { n: "02", label: "Design", body: "La géométrie de la monture est définie comme un système de paramètres ajustés à vos mesures : largeur de face, hauteur de verre, courbure du pont. Un designer valide l’équilibre et l’imprimabilité." },
  { n: "03", label: "Print", body: "Un laser fritte la poudre de nylon PA12 couche par couche — environ 350 couches par monture, sans moule ni support. La poudre non frittée est réutilisée d’une production à l’autre." },
  { n: "04", label: "Finish", body: "Dépoudrage, micro-billage, teinte dans la masse puis contrôle qualité. Chaque détail de surface — satiné, micro-texture, lattice — est obtenu à cette étape." },
  { n: "05", label: "Wear", body: "Montage des verres, ajustement, contrôle final et expédition depuis Montréal. La monture arrive exactement comme elle a été conçue, prête à être portée." },
];

export default function ProcessPage() {
  return (
    <>
      <section className="pb-8 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Le procédé</p>
          </FadeIn>
          <AnimatedText
            text="Du visage à l’objet, sans approximation."
            className="max-w-4xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Une chaîne numérique continue, du repère facial à la monture finie.
              Cinq étapes, aucune sous-traitée à l’à-peu-près.
            </p>
          </FadeIn>
        </div>
      </section>

      <ProcessSequence />

      <section className="py-12 md:py-16">
        <div className="container grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-display-md font-bold">Cinq étapes, une exigence.</h2>
            <p className="mt-5 leading-relaxed text-muted">
              Chaque monture parcourt l’intégralité de cette chaîne. Rien n’est
              improvisé, rien n’est standardisé pour personne.
            </p>
          </div>
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.06}>
                <div className="flex gap-6 rounded-2xl border border-border bg-surface p-7">
                  <span className="font-display text-3xl font-bold text-accent-blue">{s.n}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{s.label}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTASection title="Votre monture commence par votre visage." button="Créer mes lunettes" />
    </>
  );
}
