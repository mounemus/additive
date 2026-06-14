"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Expand } from "lucide-react";
import { Lightbox } from "@/components/ui/lightbox";
import { cn } from "@/lib/utils";

type Shot = { src: string; alt: string; span?: string; ratio: string };

const SHOTS: Shot[] = [
  { src: "/images/editorial/hero-frame.png", alt: "Monture sculpturale imprimée en 3D", span: "md:col-span-7", ratio: "aspect-[16/10]" },
  { src: "/images/editorial/macro-pa12.png", alt: "Macro de la surface nylon PA12", span: "md:col-span-5", ratio: "aspect-[16/10]" },
  { src: "/images/editorial/collection-generative.png", alt: "Collection GENERATIVE", span: "md:col-span-5", ratio: "aspect-[4/5]" },
  { src: "/images/editorial/exploded-modulair.png", alt: "Vue éclatée MODUL’AIR", span: "md:col-span-7", ratio: "aspect-[4/5]" },
  { src: "/images/editorial/collection-hybride.png", alt: "Collection HYBRIDE", span: "md:col-span-6", ratio: "aspect-[16/11]" },
  { src: "/images/editorial/generative-form.png", alt: "Forme générative paramétrique", span: "md:col-span-6", ratio: "aspect-[16/11]" },
  { src: "/images/editorial/matter-band.png", alt: "Échantillons de matières et couleurs", span: "md:col-span-12", ratio: "aspect-[21/8]" },
  { src: "/images/editorial/collection-modulair.png", alt: "Collection MODUL’AIR", span: "md:col-span-12", ratio: "aspect-[21/8]" },
];

export function LookbookGallery() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {SHOTS.map((shot, i) => (
          <motion.button
            key={shot.src}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen(shot.src)}
            className={cn("group relative overflow-hidden rounded-3xl bg-[#0a0a0a]", shot.span, shot.ratio)}
            aria-label={`Agrandir : ${shot.alt}`}
          >
            <Image
              src={shot.src}
              alt={shot.alt}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="absolute bottom-4 left-4 flex items-center gap-2 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Expand className="h-4 w-4" /> {shot.alt}
            </span>
          </motion.button>
        ))}
      </div>
      <Lightbox src={open} alt="Lookbook" open={Boolean(open)} onClose={() => setOpen(null)} />
    </>
  );
}
