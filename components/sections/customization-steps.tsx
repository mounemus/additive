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
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-28">
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
            <FadeIn delay={0.2}>
              <RevealImage
                src="/images/editorial/exploded-modulair.png"
                alt={copy.imageAlt}
                className="mt-8 hidden aspect-[4/3] rounded-3xl lg:block"
                sizes="40vw"
              />
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
