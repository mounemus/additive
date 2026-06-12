"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { HeroCanvas } from "@/components/motion/hero-canvas";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Button } from "@/components/ui/button";

type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export function HeroSection({ content }: { content: HeroContent }) {
  const reduce = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const { scrollY } = useScroll();
  const yTitle = useTransform(scrollY, [0, 600], [0, 120]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const showVideo = !reduce && !videoFailed;

  return (
    <section className="section-dark relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Fond vidéo cinématique, avec repli génératif (flow-field) */}
      {showVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <HeroCanvas className="absolute inset-0 h-full w-full" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/80" />

      <motion.div
        style={reduce ? undefined : { y: yTitle, opacity }}
        className="container relative z-10 pt-24"
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="eyebrow mb-6 !text-white/60"
        >
          {content.eyebrow}
        </motion.p>

        <h1 className="max-w-5xl font-display text-display-xl font-bold text-white">
          {content.title.split(" ").map((word, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <motion.span
                className="inline-block"
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + i * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {word}&nbsp;
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="mt-7 max-w-xl text-lg leading-relaxed text-white/70"
        >
          {content.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <MagneticButton>
            <Link href="/collections">
              <Button variant="light" size="lg" className="gap-2">
                {content.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </MagneticButton>
          <MagneticButton>
            <Link href="/personnalisation">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:border-white hover:bg-white hover:text-black"
              >
                {content.ctaSecondary}
              </Button>
            </Link>
          </MagneticButton>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/50"
        aria-hidden
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ArrowDown className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
