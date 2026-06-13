"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/motion/fade-in";

/**
 * Bande manifeste éditoriale — typographie monumentale, révélation ligne par
 * ligne, mot-clé bleu. « Votre visage n'est pas standard… »
 */
const LINES = [
  [{ t: "Votre visage" }, { t: "n’est pas", accent: true }, { t: "standard." }],
  [{ t: "Vos lunettes" }, { t: "ne devraient", accent: true }, { t: "pas l’être." }],
];

export function ManifestoBand() {
  const reduce = useReducedMotion();
  return (
    <section className="py-28 md:py-40">
      <div className="container">
        <h2 className="max-w-5xl font-display text-display-xl font-bold leading-[0.95]">
          {LINES.map((line, li) => (
            <span key={li} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={reduce ? false : { y: "110%" }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: li * 0.12, ease: [0.22, 1, 0.36, 1] }}
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
          <p className="mt-10 max-w-xl text-lg leading-relaxed text-muted">
            La fabrication additive nous libère des tailles uniques pensées pour
            personne. Chaque monture est imprimée à la demande, ajustée à une
            morphologie, accordée à un style — légère, précise, et seulement
            quand vous la voulez.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
