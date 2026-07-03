"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/motion/fade-in";
import { RevealImage } from "@/components/motion/reveal-image";
import { Parallax } from "@/components/motion/parallax";
import { MANIFESTO_BAND_COPY, type Locale } from "@/lib/i18n";

/**
 * Bande manifeste éditoriale — typographie monumentale, révélation ligne par
 * ligne, mot-clé bleu, + visuel IA génératif. « Votre visage n'est pas standard… »
 * Chaînes FR/EN centralisées dans lib/i18n.ts (MANIFESTO_BAND_COPY).
 */
export function ManifestoBand({ locale = "fr" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const copy = MANIFESTO_BAND_COPY[locale];
  const LINES = copy.lines;
  return (
    <section className="overflow-hidden py-14 md:py-20">
      <div className="container grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <h2 className="font-display text-display-lg font-bold leading-[0.95]">
            {LINES.map((line, li) => (
              <span key={li} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={reduce ? false : { y: "110%" }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.55, delay: li * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  {line.map((w, wi) => (
                    <span key={wi} className={w.accent ? "text-accent-blue" : undefined}>
                      {w.t}{" "}
                    </span>
                  ))}
                </motion.span>
              </span>
            ))}
          </h2>

          <FadeIn delay={0.3}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              {copy.paragraph}
            </p>
          </FadeIn>
        </div>

        <Parallax amount={36}>
          <RevealImage
            src="/images/editorial/generative-form.png"
            alt="Forme générative paramétrique — ADDITIVE"
            className="aspect-[4/5] rounded-3xl"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        </Parallax>
      </div>
    </section>
  );
}
