"use client";

import { withBase } from "@/lib/base-path";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { MODULAIR_COPY, type Locale } from "@/lib/i18n";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Points d'ancrage des annotations sur la vue éclatée (% du cadre vidéo). */
const ANCHORS = [
  { x: 50, y: 30, lx: 8, ly: 12 }, // Face avant
  { x: 24, y: 56, lx: 8, ly: 88 }, // Branches
  { x: 72, y: 62, lx: 92, ly: 88 }, // Verres
];

/**
 * Modularité MODUL'AIR — vue éclatée interactive : la vidéo d'assemblage
 * existante (modulair-exploded.mp4) est annotée de points d'ancrage et de
 * fines lignes techniques ; en regard, les trois modules « convergent »
 * à l'entrée (translation d'assemblage). Repli image si la vidéo échoue.
 */
export function ModulairSection({
  videoSrc = "/videos/modulair-exploded.mp4",
  locale = "fr",
}: {
  videoSrc?: string;
  locale?: Locale;
}) {
  const reduce = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const copy = MODULAIR_COPY[locale];
  const showVideo = !reduce && !videoFailed && !!videoSrc;

  return (
    <section className="overflow-hidden py-14 md:py-20">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* Vue éclatée annotée */}
          <FadeIn className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#0a0a0a]">
              {showVideo ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={withBase(videoSrc)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden="true"
                  onError={() => setVideoFailed(true)}
                />
              ) : (
                <Image
                  src={withBase("/images/editorial/exploded-modulair.png")}
                  alt={copy.videoNote}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              )}

              {/* Annotations : points d'ancrage + fines lignes vers les modules */}
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                fill="none"
              >
                {ANCHORS.map((a, i) => (
                  <g key={i}>
                    <motion.polyline
                      points={`${a.lx},${a.ly} ${(a.lx + a.x) / 2},${a.ly === 12 ? 12 : 88} ${a.x},${a.y}`}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="0.16"
                      initial={reduce ? undefined : { pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.8, delay: 0.25 + i * 0.15, ease: "easeOut" }}
                    />
                    <motion.circle
                      cx={a.x}
                      cy={a.y}
                      r="0.7"
                      fill="var(--additive-blue)"
                      initial={reduce ? undefined : { opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.3, delay: 0.9 + i * 0.15 }}
                    />
                  </g>
                ))}
              </svg>

              {/* Étiquettes des points d'ancrage */}
              {copy.modules.map((m, i) => (
                <motion.span
                  key={m.n}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4, delay: 0.9 + i * 0.15, ease: EASE }}
                  className={`absolute hidden rounded-full border border-white/20 bg-black/55 px-3 py-1 font-mono text-[10px] tracking-[0.15em] text-white/85 backdrop-blur-sm sm:block ${
                    i === 0 ? "left-[4%] top-[6%]" : i === 1 ? "bottom-[6%] left-[4%]" : "bottom-[6%] right-[4%]"
                  }`}
                >
                  {m.n} · {m.title.toUpperCase()}
                </motion.span>
              ))}

              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 sm:block">
                {copy.videoNote}
              </span>
            </div>
          </FadeIn>

          {/* Modules — translation convergente « assemblage » à l'entrée */}
          <div>
            <FadeIn>
              <p className="eyebrow mb-4">{copy.eyebrow}</p>
            </FadeIn>
            <AnimatedText text={copy.title} className="font-display text-display-md font-bold" />
            <FadeIn delay={0.15}>
              <p className="mt-5 leading-relaxed text-muted">{copy.paragraph}</p>
            </FadeIn>

            <div className="mt-8">
              {copy.modules.map((m, i) => (
                <motion.div
                  key={m.n}
                  initial={reduce ? false : { opacity: 0, x: i % 2 === 0 ? -28 : 28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
                  className="group flex items-baseline gap-5 border-t border-border py-5 last:border-b"
                >
                  <span className="whitespace-nowrap font-mono text-xs text-accent-blue">{m.n}</span>
                  <div>
                    <h3 className="font-display font-semibold transition-colors duration-300 group-hover:text-accent-blue">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{m.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <FadeIn delay={0.2}>
              <Link
                href={locale === "en" ? "/en/collections" : "/collections"}
                className="focus-ring group mt-7 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-foreground"
              >
                <span className="border-b border-border pb-0.5 transition-colors group-hover:border-accent-blue group-hover:text-accent-blue">
                  {copy.cta}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
