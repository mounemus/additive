import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { RevealImage } from "@/components/motion/reveal-image";
import { CUSTOMIZATION_STEPS_COPY, type Locale } from "@/lib/i18n";

/** Étapes FR historiques (chaînes centralisées dans lib/i18n.ts). */
export const CUSTOMIZATION_STEPS = CUSTOMIZATION_STEPS_COPY.fr.steps;

export function CustomizationSteps({
  compact = false,
  locale = "fr",
}: {
  compact?: boolean;
  locale?: Locale;
}) {
  const copy = CUSTOMIZATION_STEPS_COPY[locale];
  const steps = compact ? copy.steps.slice(0, 6) : copy.steps;
  return (
    <section className="py-14 md:py-20">
      <div className="container">
        {/* Deux colonnes équilibrées : texte + CTA centrés verticalement face
            à la grille — l'image éclatée passe en bandeau pleine largeur
            dessous (zéro vide résiduel sous la grille). */}
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <FadeIn>
              <p className="eyebrow mb-4">{copy.eyebrow}</p>
            </FadeIn>
            <AnimatedText
              text={copy.title}
              className="font-display text-display-md font-bold"
            />
            <FadeIn delay={0.2}>
              <p className="mt-6 leading-relaxed text-muted">{copy.paragraph}</p>
              <Link href="/personnalisation" className="mt-8 inline-block">
                <Button size="lg" className="gap-2">
                  {copy.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </FadeIn>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2">
            {steps.map((step) => (
              <StaggerItem key={step.n} className="h-full">
                <div className="group h-full rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
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

        {/* Bandeau image éclatée pleine largeur — 21/9, léger voile + cartouche
            technique (masqué sous lg, comme l'ancienne image de colonne). */}
        <FadeIn delay={0.15} className="mt-12 hidden lg:block">
          <div className="relative overflow-hidden rounded-3xl">
            <RevealImage
              src="/images/editorial/exploded-modulair.png"
              alt={copy.imageAlt}
              className="aspect-[21/9]"
              sizes="(max-width: 1400px) 90vw, 1272px"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
            />
            <span className="absolute bottom-4 left-5 z-20 font-mono text-[10px] uppercase tracking-[0.25em] text-white/85">
              {copy.imageCaption}
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
