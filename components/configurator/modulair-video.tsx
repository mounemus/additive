"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { cn } from "@/lib/utils";

/** Lecteur vidéo de la vraie monture MODUL'AIR (auto, boucle, muet). */
export function ModulairVideo({
  className,
  contain = true,
  src = "/videos/modulair-exploded.mp4",
}: {
  className?: string;
  contain?: boolean;
  src?: string;
}) {
  return (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      aria-hidden="true"
      className={cn("h-full w-full", contain ? "object-contain" : "object-cover", className)}
    />
  );
}

/** Section complète pour la page collection MODUL'AIR. */
export function ModulairVideoSection() {
  return (
    <section className="py-14 md:py-20">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div>
          <FadeIn>
            <p className="eyebrow mb-3">MODUL’AIR — système modulaire</p>
          </FadeIn>
          <AnimatedText text="Une monture. Des modules." className="font-display text-display-md font-bold" />
          <FadeIn delay={0.15}>
            <p className="mt-5 max-w-md leading-relaxed text-muted">
              Face, branches et verres se composent et s’assemblent. Réparez,
              recolorez ou faites évoluer un module — sans racheter la paire.
            </p>
            <Link href="/personnalisation/modulair" className="mt-7 inline-block">
              <Button size="lg">Moduler mes lunettes</Button>
            </Link>
          </FadeIn>
        </div>
        <FadeIn delay={0.1}>
          <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-surface to-background">
            <ModulairVideo />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
