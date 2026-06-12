import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";

export const CUSTOMIZATION_STEPS = [
  { n: "01", title: "Choisir une base", body: "Partez d’une monture de la collection ou d’une feuille blanche." },
  { n: "02", title: "Sélectionner la forme", body: "Panto, rectangulaire, sculpturale : la géométrie qui vous va." },
  { n: "03", title: "Choisir la couleur", body: "Teinte dans la masse : Black, White, Blue, Red, Orange…" },
  { n: "04", title: "Adapter les branches", body: "Longueur, courbure et style ajustés à votre morphologie." },
  { n: "05", title: "Choisir les verres", body: "Sans correction, correcteurs ou solaires." },
  { n: "06", title: "Ajouter une finition", body: "Satinée, micro-texturée ou premium polie." },
  { n: "07", title: "Valider le style", body: "Trois concepts générés, fidèles à votre profil." },
  { n: "08", title: "Recevoir une estimation", body: "Prix transparent, calculé sur votre configuration." },
  { n: "09", title: "Commander", body: "Ou demander un accompagnement personnalisé." },
];

export function CustomizationSteps({ compact = false }: { compact?: boolean }) {
  const steps = compact ? CUSTOMIZATION_STEPS.slice(0, 6) : CUSTOMIZATION_STEPS;
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-28">
            <FadeIn>
              <p className="eyebrow mb-4">Personnalisation</p>
            </FadeIn>
            <AnimatedText
              text="Une lunette adaptée à votre morphologie, votre style, votre personnalité."
              className="font-display text-display-md font-bold"
            />
            <FadeIn delay={0.2}>
              <p className="mt-6 leading-relaxed text-muted">
                Forme, couleur, branches, verres, finitions : chaque paramètre
                se configure. Notre parcours guidé convertit vos préférences en
                concepts imprimables — et votre visage devient le point de
                départ du design.
              </p>
              <Link href="/personnalisation" className="mt-8 inline-block">
                <Button size="lg" className="gap-2">
                  Créer ma monture <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </FadeIn>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2">
            {steps.map((step) => (
              <StaggerItem key={step.n}>
                <div className="group rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <p className="font-display text-sm font-bold text-accent-blue">
                    {step.n}
                  </p>
                  <h3 className="mt-3 font-display font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted">{step.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
