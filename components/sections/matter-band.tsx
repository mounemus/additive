"use client";

import Image from "next/image";
import { Feather, Shield, Recycle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { CountUp } from "@/components/motion/count-up";
import { MATTER_BAND_COPY, type Locale } from "@/lib/i18n";

const ICONS = [Feather, Shield, Recycle];
const LAYER_COUNT = 14;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Section matière — nylon PA12 / SLS, façon laboratoire élégant :
 * - couches d'impression empilées progressivement à l'entrée en vue ;
 * - macro matière (frittage) en médaillon ;
 * - 3 indicateurs en compteurs animés (≈18 g · ≈350 couches · 0 stock).
 * Chaînes FR/EN centralisées dans lib/i18n.ts (MATTER_BAND_COPY).
 */
export function MatterBand({ locale = "fr" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const copy = MATTER_BAND_COPY[locale];

  return (
    <section className="overflow-hidden py-14 md:py-20">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Panneau laboratoire : couches SLS empilées + macro matière */}
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-surface">
              <Image
                src="/images/editorial/matter-band.png"
                alt={
                  locale === "en"
                    ? "3D-printed frame samples, PA12 nylon — ADDITIVE"
                    : "Échantillons de montures imprimées en 3D, nylon PA12 — ADDITIVE"
                }
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-90"
              />
              {/* Couches d'impression : barres horizontales bâties du bas vers le haut */}
              <div aria-hidden className="absolute inset-0 flex flex-col-reverse justify-start">
                {Array.from({ length: LAYER_COUNT }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={reduce ? false : { scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                    className="origin-left"
                    style={{
                      height: `${100 / LAYER_COUNT}%`,
                      borderTop: "1px solid rgba(21,87,255,0.22)",
                      background:
                        i % 3 === 0 ? "rgba(21,87,255,0.05)" : "transparent",
                    }}
                  />
                ))}
              </div>
              {/* Ligne de frittage (balayage laser) */}
              {!reduce && (
                <motion.div
                  aria-hidden
                  className="absolute inset-x-0 h-px bg-accent-blue/70"
                  style={{ boxShadow: "0 0 12px 1px rgba(21,87,255,0.55)" }}
                  animate={{ top: ["96%", "4%"] }}
                  transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
                />
              )}
              {/* Légende technique — bandeau haut sur scrim, lisible en entier
                  (hors de la zone du médaillon macro, bas-droit) */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 via-black/30 to-transparent px-5 pb-10 pt-4"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/85">
                  {copy.layersNote}
                </span>
              </div>
            </div>

            {/* Macro matière en médaillon — ancré coin bas-droit, décalé vers
                l'extérieur, détouré du panneau par un ring couleur fond */}
            <FadeIn delay={0.2} className="absolute -bottom-6 -right-4 hidden w-36 md:block lg:-right-8 lg:w-44">
              <div className="overflow-hidden rounded-2xl border border-border shadow-card ring-4 ring-background">
                <Image
                  src="/images/editorial/macro-pa12.png"
                  alt={locale === "en" ? "PA12 sintered nylon, macro view" : "Nylon PA12 fritté, vue macro"}
                  width={352}
                  height={352}
                  className="aspect-square object-cover"
                />
              </div>
            </FadeIn>
          </div>

          {/* Texte + indicateurs */}
          <div>
            <FadeIn>
              <p className="eyebrow mb-4">{copy.eyebrow}</p>
            </FadeIn>
            <AnimatedText text={copy.title} className="font-display text-display-md font-bold" />

            {/* Compteurs laboratoire */}
            <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
              {copy.stats.map((s) => (
                <div key={s.label} className="bg-surface px-4 py-5">
                  <CountUp
                    value={s.value}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    className="font-display text-2xl font-bold text-accent-blue md:text-3xl"
                  />
                  <p className="mt-1.5 text-xs leading-snug text-muted">{s.label}</p>
                </div>
              ))}
            </div>

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
