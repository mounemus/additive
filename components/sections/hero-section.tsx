"use client";

import { withBase } from "@/lib/base-path";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroCanvas } from "@/components/motion/hero-canvas";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Button } from "@/components/ui/button";
import { HERO_META_COPY, t, type Locale } from "@/lib/i18n";

type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Hero éditorial monumental — composition asymétrique : titre ~8rem à gauche,
 * colonne méta (atelier · matière · poids · production) à droite, ligne
 * manifeste, séquence d'entrée orchestrée (masques de révélation ligne par
 * ligne), scrim radial profond, CTA magnétique + CTA secondaire discret,
 * indicateur de scroll animé.
 */
export function HeroSection({
  content,
  videoSrc = "/videos/hero.mp4",
  posterSrc = "/images/editorial/hero-frame.png",
  locale = "fr",
}: {
  content: HeroContent;
  videoSrc?: string;
  posterSrc?: string;
  locale?: Locale;
}) {
  const reduce = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const { scrollY } = useScroll();
  const yTitle = useTransform(scrollY, [0, 600], [0, 120]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const showVideo = !reduce && !videoFailed;
  const meta = HERO_META_COPY[locale];
  const words = content.title.split(" ");

  return (
    <section className="section-dark relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Fond vidéo cinématique, avec repli image + lattice génératif */}
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
        <>
          <Image
            src={withBase(posterSrc)}
            alt=""
            fill
            priority
            aria-hidden
            // URL externe arbitraire possible (CMS) → on évite l'optimiseur
            unoptimized={/^https?:\/\//.test(posterSrc)}
            className="object-cover object-center"
            sizes="100vw"
          />
          <HeroCanvas className="absolute inset-0 h-full w-full opacity-40 mix-blend-screen" />
        </>
      )}
      {/* Scrims : dégradés directionnels + vignette radiale profonde */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/85" />
      <div className="hero-vignette absolute inset-0" />

      <motion.div
        style={reduce ? undefined : { y: yTitle, opacity }}
        className="container relative z-10 pb-28 pt-28 md:pb-32 md:pt-24"
      >
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
          {/* Colonne principale — titre monumental */}
          <div>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
              className="eyebrow mb-6 !text-white/60"
            >
              {content.eyebrow}
            </motion.p>

            <h1 className="text-hero max-w-5xl font-display font-bold text-white">
              {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={reduce ? false : { y: "112%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.85, delay: 0.28 + i * 0.07, ease: EASE }}
                  >
                    {word}&nbsp;
                  </motion.span>
                </span>
              ))}
            </h1>

            {/* Ligne manifeste — révélation masquée après le titre */}
            <p className="mt-7 max-w-xl font-display text-base font-medium text-white/85 md:text-lg">
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={reduce ? false : { y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.7, delay: 0.28 + words.length * 0.07, ease: EASE }}
                >
                  {t("tagline.line1", locale)}{" "}
                  <span className="text-accent-blue">{t("tagline.line2", locale)}</span>
                </motion.span>
              </span>
            </p>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.45 + words.length * 0.07, ease: EASE }}
              className="mt-4 max-w-xl leading-relaxed text-white/65"
            >
              {content.subtitle}
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.6 + words.length * 0.07, ease: EASE }}
              className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center"
            >
              <MagneticButton>
                <Link href="/personnalisation">
                  <Button variant="light" size="lg" className="gap-2">
                    {content.ctaPrimary}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </MagneticButton>
              {/* CTA secondaire discret — lien souligné, cible tactile ≥44px */}
              <Link
                href={locale === "en" ? "/en/collections" : "/collections"}
                className="focus-ring group inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                <span className="border-b border-white/30 pb-0.5 transition-colors group-hover:border-white">
                  {content.ctaSecondary}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Colonne méta — fiche technique verticale (droite) */}
          <motion.dl
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease: EASE }}
            className="hidden w-56 shrink-0 self-end lg:block"
            aria-label={locale === "en" ? "Key facts" : "Repères techniques"}
          >
            {meta.map((m, i) => (
              <div key={m.label} className="border-t border-white/15 py-3">
                <motion.div
                  initial={reduce ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1 + i * 0.08, ease: EASE }}
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">
                    {m.label}
                  </dt>
                  <dd className="mt-1 font-display text-sm font-semibold text-white/90">
                    {m.value}
                  </dd>
                </motion.div>
              </div>
            ))}
            <div className="border-t border-white/15" />
          </motion.dl>
        </div>
      </motion.div>

      {/* Indicateur de scroll : fine ligne animée + repère */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        aria-hidden
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
          {t("scroll.hint", locale)}
        </span>
        <span className="relative block h-10 w-px overflow-hidden bg-white/15">
          <motion.span
            className="absolute left-0 top-0 h-4 w-px bg-white/80"
            animate={reduce ? undefined : { y: [-16, 40] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
