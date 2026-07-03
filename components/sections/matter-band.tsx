import { Feather, Shield, Recycle } from "lucide-react";
import { RevealImage } from "@/components/motion/reveal-image";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { MATTER_BAND_COPY, type Locale } from "@/lib/i18n";

const ICONS = [Feather, Shield, Recycle];

/**
 * Section matière — nylon PA12 / fabrication additive (faits vérifiables).
 * Chaînes FR/EN centralisées dans lib/i18n.ts (MATTER_BAND_COPY).
 */
export function MatterBand({ locale = "fr" }: { locale?: Locale }) {
  const copy = MATTER_BAND_COPY[locale];
  return (
    <section className="overflow-hidden py-14 md:py-20">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <RevealImage
            src="/images/editorial/matter-band.png"
            alt={
              locale === "en"
                ? "3D-printed frame samples, PA12 nylon — ADDITIVE"
                : "Échantillons de montures imprimées en 3D, nylon PA12 — ADDITIVE"
            }
            className="aspect-[4/3] rounded-3xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div>
            <FadeIn>
              <p className="eyebrow mb-4">{copy.eyebrow}</p>
            </FadeIn>
            <AnimatedText
              text={copy.title}
              className="font-display text-display-md font-bold"
            />
            <div className="mt-8 space-y-6">
              {copy.points.map((p, i) => {
                const Icon = ICONS[i % ICONS.length];
                return (
                  <FadeIn key={p.title}>
                    <div className="flex gap-4">
                      <Icon className="mt-0.5 h-6 w-6 shrink-0 text-accent-blue" />
                      <div>
                        <h3 className="font-display font-semibold">{p.title}</h3>
                        <p className="mt-1 leading-relaxed text-muted">{p.body}</p>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
