import { TechnologySection } from "@/components/sections/technology-section";
import { CTASection } from "@/components/sections/cta-section";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { getContent } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Technologie — Impression 3D SLS et nylon PA12",
  description:
    "Impression 3D SLS, nylon PA12, design paramétrique, production locale à la demande : la technologie derrière les lunettes ADDITIVE, expliquée simplement.",
  path: "/technologie",
});

const PROCESS = [
  {
    step: "01",
    title: "Conception paramétrique",
    body: "Le modèle est défini comme un système de paramètres : largeur de face, hauteur de verre, courbure du pont. Vos mesures pilotent la géométrie.",
  },
  {
    step: "02",
    title: "Validation design",
    body: "Un designer vérifie l’équilibre des proportions, le confort des appuis et l’imprimabilité de chaque configuration avant production.",
  },
  {
    step: "03",
    title: "Frittage laser SLS",
    body: "Un laser fusionne la poudre de nylon PA12 couche par couche — environ 350 couches par monture. La poudre non frittée est réutilisée.",
  },
  {
    step: "04",
    title: "Finition et contrôle",
    body: "Dépoudrage, micro-billage, teinte dans la masse puis contrôle qualité : chaque paire est inspectée et ajustée à la main avant expédition.",
  },
];

export default async function TechnologyPage() {
  const technology = await getContent<{
    title: string;
    intro: string;
    blocks: { title: string; body: string }[];
  }>("technology");

  return (
    <>
      <section className="pb-10 pt-36 md:pt-44">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Technologie</p>
          </FadeIn>
          <AnimatedText
            text="La fabrication additive, sans le jargon."
            className="max-w-4xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Pas de promesses invérifiables : voici concrètement comment vos
              lunettes sont conçues, imprimées et finies — et pourquoi ce
              procédé change ce qu’une monture peut être.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Processus — sections sticky éditoriales */}
      <section className="py-16 md:py-24">
        <div className="container grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-display-md font-bold">
              De la mesure à l’objet.
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              Une chaîne numérique continue : aucune étape n’est sous-traitée à
              l’approximation. Chaque monture parcourt ces quatre phases.
            </p>
          </div>
          <div className="space-y-6">
            {PROCESS.map((p, i) => (
              <FadeIn key={p.step} delay={i * 0.08}>
                <div className="flex gap-6 rounded-2xl border border-border bg-surface p-7">
                  <span className="font-display text-3xl font-bold text-accent-blue">
                    {p.step}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {p.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <TechnologySection content={technology} />

      <CTASection
        title="La technologie n’est pas l’argument. C’est le moyen."
        button="Découvrir la personnalisation"
      />
    </>
  );
}
