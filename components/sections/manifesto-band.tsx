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
          <FadeIn>
            <p className="eyebrow mb-4">{copy.eyebrow}</p>
          </FadeIn>
          {/* L'observateur (whileInView) vit sur le <h2> non clippé : les lignes
              translatées à 110% dans un parent overflow-hidden sont invisibles
              pour IntersectionObserver et ne se révéleraient jamais sinon. */}
          <motion.h2
            className="font-display text-display-lg font-bold leading-[0.95]"
            initial={reduce ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {LINES.map((line, li) => (
              <span key={li} className="block overflow-hidden">
                <motion.span
                  className="block"
                  variants={reduce ? undefined : { hidden: { y: "110%" }, visible: { y: 0 } }}
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
          </motion.h2>

          <FadeIn delay={0.3}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              {copy.paragraph}
            </p>
          </FadeIn>
        </div>

        {/* Carte wireframe — hauteur bornée (max-h) pour rester équilibrée
            face à la colonne texte, centrée dans sa colonne. */}
        <Parallax amount={36} className="lg:justify-self-center lg:self-center">
          <RevealImage
            src="/images/editorial/generative-form.png"
            alt="Forme générative paramétrique — ADDITIVE"
            className="aspect-[4/5] max-h-[32rem] w-full rounded-3xl lg:w-[26rem]"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        </Parallax>
      </div>
    </section>
  );
}
